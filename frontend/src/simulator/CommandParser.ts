import { ClusterSimulator } from './ClusterSimulator';

export interface CommandResult {
  output: string;
  success: boolean;
  commandType: string;
  parsedObject?: {
    name?: string;
    image?: string;
    nodeName?: string;
    cpuRequest?: number;
    memoryRequest?: number;
  };
  educationalHint?: string;
}

function parseCpu(value?: string): number | undefined {
  if (!value) return undefined;
  if (value.endsWith('m')) return Number.parseFloat(value.slice(0, -1)) / 1000;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseMemoryMi(value?: string): number | undefined {
  if (!value) return undefined;
  if (value.endsWith('Gi')) return Number.parseFloat(value.slice(0, -2)) * 1024;
  if (value.endsWith('Mi')) return Number.parseFloat(value.slice(0, -2));
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatCpu(cores: number): string {
  return cores < 1 ? `${Math.round(cores * 1000)}m` : `${cores}`;
}

export class CommandParser {
  constructor(private simulator: ClusterSimulator) {}

  public execute(rawCommand: string): CommandResult {
    const trimmed = rawCommand.trim();
    if (!trimmed) return { output: '', success: true, commandType: 'empty' };

    const tokens = this.tokenize(trimmed);
    if (tokens.length === 0) return { output: '', success: true, commandType: 'empty' };

    const first = tokens[0].toLowerCase();
    if (first === 'clear') return { output: '__CLEAR__', success: true, commandType: 'clear' };
    if (first === 'help') return this.handleHelp();
    if (first === 'history') return { output: 'Use Up/Down arrow keys to browse previous commands.', success: true, commandType: 'history' };

    if (first !== 'kubectl' && first !== 'oc') {
      return {
        output: `bash: ${first}: command not found\n\nHint: use kubectl commands such as 'kubectl get nodes' or 'kubectl get pods'.`,
        success: false,
        commandType: 'unknown',
      };
    }

    if (tokens.length === 1) {
      return { output: 'Kubernetes Client Version: v1.30.0\nUsage: kubectl [flags] [options]', success: true, commandType: 'kubectl_root' };
    }

    const verb = tokens[1].toLowerCase();
    const rest = tokens.slice(2);
    switch (verb) {
      case 'get': return this.handleGet(rest);
      case 'describe': return this.handleDescribe(rest);
      case 'run': return this.handleRun(rest);
      case 'delete': return this.handleDelete(rest);
      case 'status': return this.handleStatus();
      case 'cluster-info': return this.handleClusterInfo();
      case 'whoami': return { output: 'student@k8s.training.cluster.local', success: true, commandType: 'whoami' };
      case 'explain': return this.handleExplain(rest);
      default:
        return {
          output: `This training simulator does not implement 'kubectl ${verb}' yet. This is a simulator limitation, not a Kubernetes server error.`,
          success: false,
          commandType: 'unsupported_simulator_command',
        };
    }
  }

  private tokenize(command: string): string[] {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(command)) !== null) tokens.push(match[1] || match[2] || match[0]);
    return tokens;
  }

  private outputFormat(args: string[]): string | null {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('-o=')) return arg.slice(3).toLowerCase();
      if (arg.startsWith('--output=')) return arg.slice('--output='.length).toLowerCase();
      if ((arg === '-o' || arg === '--output') && args[i + 1]) return args[i + 1].toLowerCase();
    }
    return null;
  }

  private handleGet(args: string[]): CommandResult {
    if (args.length === 0) return { output: 'error: resource type is required', success: false, commandType: 'get_empty' };
    const resource = args[0].toLowerCase();
    const format = this.outputFormat(args);
    const isWide = format === 'wide';
    const state = this.simulator.getState();

    if (resource === 'node' || resource === 'nodes' || resource === 'no') {
      const headers = isWide
        ? 'NAME       STATUS   ROLES    AGE   VERSION   INTERNAL-IP   OS-IMAGE\n'
        : 'NAME       STATUS   ROLES    AGE   VERSION\n';
      const rows = state.nodes.map((n) => {
        const base = `${n.name.padEnd(10)} ${n.status.padEnd(8)} ${n.role.padEnd(8)} ${'24d'.padEnd(5)} v1.30.0`;
        return isWide ? `${base.padEnd(45)} ${`192.168.10.${n.laneIndex + 10}`.padEnd(13)} Ubuntu 24.04 LTS` : base;
      });
      return { output: headers + rows.join('\n'), success: true, commandType: isWide ? 'get_nodes_wide' : 'get_nodes' };
    }

    if (resource === 'pod' || resource === 'pods' || resource === 'po') {
      const specificPodName = args[1] && !args[1].startsWith('-') ? args[1] : null;
      let pods = state.pods;
      if (specificPodName) {
        pods = pods.filter((p) => p.name === specificPodName);
        if (!pods.length) return { output: `Error from server (NotFound): pods "${specificPodName}" not found`, success: false, commandType: 'get_pod_not_found' };
      }
      if (!pods.length) return { output: `No resources found in ${state.namespace} namespace.`, success: true, commandType: isWide ? 'get_pods_wide' : 'get_pods' };

      const headers = isWide
        ? 'NAME             READY   STATUS             RESTARTS   AGE   IP           NODE       NOMINATED NODE   READINESS GATES\n'
        : 'NAME             READY   STATUS             RESTARTS   AGE\n';
      const rows = pods.map((p) => {
        const ready = p.ready ? '1/1' : '0/1';
        const age = `${Math.floor((Date.now() - p.creationTimestamp) / 1000)}s`;
        if (isWide) {
          return `${p.name.padEnd(16)} ${ready.padEnd(7)} ${p.status.padEnd(18)} ${String(p.restarts).padEnd(10)} ${age.padEnd(5)} ${(p.ip || '<none>').padEnd(12)} ${(p.nodeName || '<none>').padEnd(10)} <none>           <none>`;
        }
        return `${p.name.padEnd(16)} ${ready.padEnd(7)} ${p.status.padEnd(18)} ${String(p.restarts).padEnd(10)} ${age}`;
      });
      return { output: headers + rows.join('\n'), success: true, commandType: isWide ? 'get_pods_wide' : 'get_pods' };
    }

    return { output: `error: the server doesn't have a resource type "${resource}"`, success: false, commandType: 'get_unknown_resource' };
  }

  private handleDescribe(args: string[]): CommandResult {
    if (!args.length) return { output: 'error: resource type and name are required', success: false, commandType: 'describe_empty' };
    const resource = args[0].toLowerCase();
    const name = args[1];
    if (!name) return { output: `error: specify resource name`, success: false, commandType: 'describe_no_name' };
    const state = this.simulator.getState();

    if (resource === 'node' || resource === 'nodes' || resource === 'no') {
      const node = state.nodes.find((n) => n.name === name);
      if (!node) return { output: `Error from server (NotFound): nodes "${name}" not found`, success: false, commandType: 'describe_node_not_found' };
      const cpuAllocatable = node.cpuAllocatable ?? node.cpuCapacity;
      const memoryAllocatable = node.memoryAllocatable ?? node.memoryCapacity;
      const podRows = node.pods.map((podName) => {
        const pod = state.pods.find((p) => p.name === podName);
        if (!pod) return '';
        const cpuPct = Math.round((pod.cpuRequest / cpuAllocatable) * 100);
        const memPct = Math.round((pod.memoryRequest / memoryAllocatable) * 100);
        return `  ${state.namespace.padEnd(18)} ${pod.name.padEnd(18)} ${formatCpu(pod.cpuRequest).padEnd(15)} ${'-'.padEnd(11)} ${`${pod.memoryRequest}Mi (${memPct}%)`.padEnd(18)} -  # CPU ${cpuPct}%`;
      }).filter(Boolean).join('\n') || '  <none>';

      const output = `Name:               ${node.name}\nRoles:              ${node.role}\nStatus:             ${node.status}\nUnschedulable:      ${node.unschedulable ? 'true' : 'false'}\nCapacity:\n  cpu:                ${node.cpuCapacity}\n  memory:             ${node.memoryCapacity}Mi\nAllocatable:\n  cpu:                ${cpuAllocatable}\n  memory:             ${memoryAllocatable}Mi\nAllocated resources (requests, not live usage):\n  Resource           Requests\n  cpu                ${formatCpu(node.cpuAllocated)} (${Math.round((node.cpuAllocated / cpuAllocatable) * 100)}%)\n  memory             ${node.memoryAllocated}Mi (${Math.round((node.memoryAllocated / memoryAllocatable) * 100)}%)\nNon-terminated Pods: (${node.pods.length} pods)\n  Namespace          Name               CPU Requests    CPU Limits  Memory Requests    Memory Limits\n${podRows}`;
      return { output, success: true, commandType: 'describe_node', parsedObject: { nodeName: node.name } };
    }

    if (resource === 'pod' || resource === 'pods' || resource === 'po') {
      const pod = state.pods.find((p) => p.name === name);
      if (!pod) return { output: `Error from server (NotFound): pods "${name}" not found`, success: false, commandType: 'describe_pod_not_found' };
      const podEvents = [...state.events]
        .reverse()
        .filter((event) => event.object === `pod/${pod.name}` && ['Created', 'Persisted', 'Scheduling', 'FailedScheduling', 'Scheduled', 'Pulling', 'Started'].includes(event.reason))
        .map((event) => `  ${event.type.padEnd(7)} ${event.reason.padEnd(17)} ${event.timestamp.padEnd(8)} ${event.message}`)
        .join('\n') || '  <none>';
      const output = `Name:         ${pod.name}\nNamespace:    ${pod.namespace}\nNode:         ${pod.nodeName || '<none>'}\nStatus:       ${pod.status}\nIP:           ${pod.ip || '<none>'}\nContainers:\n  ${pod.name}:\n    Image:          ${pod.image}\n    State:          ${pod.status === 'Running' ? 'Running' : 'Waiting'}\n    Ready:          ${pod.ready ? 'True' : 'False'}\n    Restart Count:  ${pod.restarts}\n    Requests:\n      cpu:          ${formatCpu(pod.cpuRequest)}\n      memory:       ${pod.memoryRequest}Mi\nConditions:\n  Ready             ${pod.ready ? 'True' : 'False'}\n  ContainersReady   ${pod.ready ? 'True' : 'False'}\n  PodScheduled      ${pod.nodeName ? 'True' : 'False'}\nEvents:\n  Type    Reason            Time     Message\n${podEvents}`;
      return { output, success: true, commandType: 'describe_pod', parsedObject: { name: pod.name, image: pod.image, nodeName: pod.nodeName || undefined } };
    }

    return { output: `error: unsupported resource type "${resource}"`, success: false, commandType: 'describe_unknown' };
  }

  private handleRun(args: string[]): CommandResult {
    if (!args.length) return { output: 'error: NAME is required for kubectl run', success: false, commandType: 'run_no_name' };
    const podName = args[0];
    let image = '';
    let cpuRequest = 0.25;
    let memoryRequest = 256;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--image=')) image = arg.slice('--image='.length);
      else if (arg === '--image' && args[i + 1]) image = args[++i];
      else if (arg === '--requests' || arg.startsWith('--requests=')) {
        return {
          output: 'error: unknown flag: --requests\n\nThis simulator follows current kubectl syntax. Use --overrides with a Pod spec when you need to set resource requests.',
          success: false,
          commandType: 'run_invalid_requests_flag',
        };
      } else if (arg === '--overrides' || arg.startsWith('--overrides=')) {
        let raw = arg === '--overrides' ? args[++i] : arg.slice('--overrides='.length);
        if (!raw && args[i + 1]) raw = args[++i];
        try {
          const overrides = JSON.parse(raw);
          const container = overrides?.spec?.containers?.[0];
          if (container?.image && !image) image = container.image;
          const cpu = parseCpu(container?.resources?.requests?.cpu);
          const memory = parseMemoryMi(container?.resources?.requests?.memory);
          if (cpu !== undefined) cpuRequest = cpu;
          if (memory !== undefined) memoryRequest = memory;
        } catch {
          return { output: 'error: --overrides must contain valid inline JSON', success: false, commandType: 'run_invalid_overrides' };
        }
      }
    }

    if (!image) return { output: `error: flag --image is required\nExample: kubectl run ${podName} --image=nginx`, success: false, commandType: 'run_no_image' };
    const result = this.simulator.createPod(podName, image, cpuRequest, memoryRequest);
    return { output: result.message, success: result.success, commandType: 'run_pod', parsedObject: { name: podName, image, cpuRequest, memoryRequest } };
  }

  private handleDelete(args: string[]): CommandResult {
    if (!args.length) return { output: 'error: resource type is required', success: false, commandType: 'delete_empty' };
    const resource = args[0].toLowerCase();
    const name = args[1];
    if (!['pod', 'pods', 'po'].includes(resource)) return { output: `This simulator currently implements pod deletion only.`, success: false, commandType: 'delete_unsupported' };
    if (!name) return { output: 'error: pod name is required', success: false, commandType: 'delete_no_name' };
    const result = this.simulator.deletePod(name);
    return { output: result.message, success: result.success, commandType: 'delete_pod', parsedObject: { name } };
  }

  private handleStatus(): CommandResult {
    const state = this.simulator.getState();
    const ready = state.nodes.filter((node) => node.status === 'Ready').length;
    return { output: `Kubernetes Cluster: ${state.clusterName}\nNamespace: ${state.namespace}\nGame/SLA Health: ${state.health}%\nNodes Ready: ${ready}/${state.nodes.length}\nPods: ${state.pods.length}`, success: true, commandType: 'status' };
  }

  private handleClusterInfo(): CommandResult {
    return { output: 'Kubernetes control plane is running at https://k8s.training.cluster.local:6443', success: true, commandType: 'cluster-info' };
  }

  private handleExplain(args: string[]): CommandResult {
    const target = (args[0] || '').toLowerCase();
    if (target === 'pod' || target === 'pods') return { output: 'KIND: Pod\nA Pod is the smallest deployable Kubernetes object and contains one or more containers.', success: true, commandType: 'explain_pod' };
    if (target === 'node' || target === 'nodes') return { output: 'KIND: Node\nA Node is a machine registered with the cluster that can run Pods when it is eligible for scheduling.', success: true, commandType: 'explain_node' };
    return { output: `This simulator currently implements 'kubectl explain pod' and 'kubectl explain node'.`, success: true, commandType: 'explain' };
  }

  private handleHelp(): CommandResult {
    return {
      output: `KUBERNETES DEFENSE — SUPPORTED TRAINING COMMANDS\n\nkubectl get nodes\nkubectl get pods\nkubectl get pods -o wide\nkubectl describe node <name>\nkubectl describe pod <name>\nkubectl run <name> --image=<image>\nkubectl run <name> --image=<image> --overrides='<inline Pod JSON>'\nkubectl delete pod <name>\nkubectl cluster-info\n\nNote: unsupported kubectl commands are simulator limitations; they are not presented as Kubernetes server errors.`,
      success: true,
      commandType: 'help',
    };
  }
}
