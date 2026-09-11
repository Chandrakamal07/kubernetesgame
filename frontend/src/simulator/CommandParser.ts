import { ClusterSimulator } from './ClusterSimulator.ts';
import { formatCpu, formatMemory, parseCpuQuantity, parseMemoryQuantity } from './imageUtils.ts';
import { VIRTUAL_MANIFESTS } from './manifestCatalog.ts';

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
    filename?: string;
    outputFormat?: string;
  };
  educationalHint?: string;
}

interface ParsedOptions {
  outputFormat: 'default' | 'wide' | 'json' | 'yaml' | 'name';
  filename?: string;
  image?: string;
  overrides?: string;
  namespace?: string;
  selector?: string;
  positionalArgs: string[];
  flagsError?: string;
}

export class CommandParser {
  private simulator: ClusterSimulator;

  constructor(simulator: ClusterSimulator) {
    this.simulator = simulator;
  }

  public execute(rawCommand: string): CommandResult {
    const trimmed = rawCommand.trim();
    if (!trimmed) {
      return { output: '', success: true, commandType: 'empty' };
    }

    const tokens = this.tokenize(trimmed);
    if (tokens.length === 0) {
      return { output: '', success: true, commandType: 'empty' };
    }

    const first = tokens[0].toLowerCase();

    if (first === 'clear') {
      return { output: '__CLEAR__', success: true, commandType: 'clear' };
    }

    if (first === 'help') {
      return this.handleHelp();
    }

    if (first === 'history') {
      return { output: 'Use Up/Down arrow keys on the keyboard to browse previous commands.', success: true, commandType: 'history' };
    }

    if (first === 'ls' || first === 'dir') {
      const manifests = Object.keys(VIRTUAL_MANIFESTS).join('  ');
      return {
        output: `${manifests}\n\nUse 'cat <filename>' to view or 'kubectl apply -f <filename>' to deploy.`,
        success: true,
        commandType: 'ls',
      };
    }

    if (first === 'cat') {
      const filename = tokens[1];
      if (!filename) {
        return { output: 'usage: cat <filename>', success: false, commandType: 'cat_error' };
      }
      const manifest = VIRTUAL_MANIFESTS[filename];
      if (!manifest) {
        return { output: `cat: ${filename}: No such file or directory`, success: false, commandType: 'cat_not_found' };
      }
      return { output: manifest.yamlContent, success: true, commandType: 'cat' };
    }

    if (first !== 'kubectl') {
      return {
        output: `bash: ${first}: command not found\n\nHint: You are on a Kubernetes bastion host. Use 'kubectl' commands, e.g. 'kubectl get nodes', 'kubectl run web-01 --image=nginx', or 'kubectl apply -f compute-01.yaml'. Type 'help' for examples.`,
        success: false,
        commandType: 'unknown',
        educationalHint: `Kubernetes CLI commands begin with 'kubectl'. Try 'kubectl get nodes' or 'kubectl get pods'.`,
      };
    }

    if (tokens.length === 1) {
      return {
        output: `Kubernetes Client Version: v1.30.0\nUsage: kubectl [flags] [options]\n\nUse "kubectl <command> --help" for more information about a given command.`,
        success: true,
        commandType: 'kubectl_root',
      };
    }

    const verb = tokens[1].toLowerCase();
    const rawArgs = tokens.slice(2);
    const parsedOpts = this.parseOptions(rawArgs);

    if (parsedOpts.flagsError) {
      return {
        output: parsedOpts.flagsError,
        success: false,
        commandType: 'flags_error',
      };
    }

    switch (verb) {
      case 'get':
        return this.handleGet(parsedOpts);
      case 'describe':
        return this.handleDescribe(parsedOpts);
      case 'run':
        return this.handleRun(parsedOpts);
      case 'apply':
      case 'create':
        return this.handleApply(parsedOpts, verb);
      case 'delete':
        return this.handleDelete(parsedOpts);
      case 'cluster-info':
        return this.handleClusterInfo();
      case 'explain':
        return this.handleExplain(parsedOpts.positionalArgs);
      case 'logs':
      case 'top':
      case 'exec':
      case 'port-forward':
      case 'cordon':
      case 'drain':
      case 'scale':
        return {
          output: `info: The simulator does not implement "kubectl ${verb}" in this training stage yet.\nSupported commands in Chapter 1: kubectl get, kubectl describe, kubectl run, kubectl apply -f, kubectl delete.`,
          success: false,
          commandType: `unimplemented_${verb}`,
          educationalHint: `Use 'kubectl get nodes', 'kubectl get pods -o wide', 'kubectl describe node <name>', 'kubectl run <name> --image=<image>', or 'kubectl apply -f <manifest.yaml>'.`,
        };
      default:
        return {
          output: `error: unknown command "${verb}" for "kubectl"\n\nDid you mean:\n  kubectl get\n  kubectl describe\n  kubectl run\n  kubectl apply\n  kubectl delete`,
          success: false,
          commandType: 'unknown_verb',
          educationalHint: `Supported commands: 'kubectl get nodes', 'kubectl get pods', 'kubectl run <name> --image=<image>', 'kubectl describe node <name>'.`,
        };
    }
  }

  private tokenize(command: string): string[] {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(command)) !== null) {
      tokens.push(match[1] || match[2] || match[0]);
    }
    return tokens;
  }

  /**
   * Reusable, robust flag and options parser.
   * Accurately distinguishes -o wide / --output=wide from -o json / -o yaml.
   */
  private parseOptions(args: string[]): ParsedOptions {
    const opts: ParsedOptions = {
      outputFormat: 'default',
      positionalArgs: [],
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      // -o or --output
      if (arg === '-o' || arg === '--output') {
        if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
          opts.flagsError = `error: flag needs an argument: '${arg}'\nSee 'kubectl --help' for options.`;
          return opts;
        }
        const val = args[++i].toLowerCase();
        if (val === 'wide' || val === 'json' || val === 'yaml' || val === 'name') {
          opts.outputFormat = val;
        } else {
          opts.flagsError = `error: unable to match a printer for format "${val}". Valid options: wide, json, yaml, name`;
          return opts;
        }
      } else if (arg.startsWith('-o=') || arg.startsWith('--output=')) {
        const val = arg.split('=')[1].toLowerCase();
        if (val === 'wide' || val === 'json' || val === 'yaml' || val === 'name') {
          opts.outputFormat = val;
        } else {
          opts.flagsError = `error: unable to match a printer for format "${val}". Valid options: wide, json, yaml, name`;
          return opts;
        }
      }
      // -f or --filename
      else if (arg === '-f' || arg === '--filename') {
        if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
          opts.flagsError = `error: flag needs an argument: '${arg}'`;
          return opts;
        }
        opts.filename = args[++i];
      } else if (arg.startsWith('-f=') || arg.startsWith('--filename=')) {
        opts.filename = arg.split('=')[1];
      }
      // --image
      else if (arg === '--image') {
        if (i + 1 < args.length) opts.image = args[++i];
      } else if (arg.startsWith('--image=')) {
        opts.image = arg.split('=')[1];
      }
      // --overrides
      else if (arg === '--overrides') {
        if (i + 1 < args.length) opts.overrides = args[++i];
      } else if (arg.startsWith('--overrides=')) {
        opts.overrides = arg.split('=')[1];
      }
      // Positional args
      else if (!arg.startsWith('-')) {
        opts.positionalArgs.push(arg);
      }
    }

    return opts;
  }

  private handleGet(opts: ParsedOptions): CommandResult {
    const args = opts.positionalArgs;
    if (args.length === 0) {
      return {
        output: `error: You must specify the type of resource to get. E.g. 'kubectl get nodes' or 'kubectl get pods'`,
        success: false,
        commandType: 'get_empty',
        educationalHint: `Specify the resource type, like: kubectl get nodes or kubectl get pods`,
      };
    }

    const resource = args[0].toLowerCase();
    const isWide = opts.outputFormat === 'wide';

    // Handle nodes
    if (resource === 'node' || resource === 'nodes' || resource === 'no') {
      const state = this.simulator.getState();

      if (opts.outputFormat === 'json') {
        const jsonOutput = JSON.stringify(
          {
            apiVersion: 'v1',
            kind: 'NodeList',
            items: state.nodes.map((n) => ({
              metadata: { name: n.name, labels: n.labels },
              status: {
                conditions: n.conditions,
                capacity: { cpu: `${n.cpuCapacity}`, memory: `${n.memoryCapacity}Mi` },
                allocatable: { cpu: `${n.cpuAllocatable}`, memory: `${n.memoryAllocatable}Mi` },
              },
            })),
          },
          null,
          2
        );
        return { output: jsonOutput, success: true, commandType: 'get_nodes_json' };
      }

      if (opts.outputFormat === 'yaml') {
        return {
          output: `apiVersion: v1\nkind: NodeList\nitems:\n${state.nodes.map((n) => `  - metadata:\n      name: ${n.name}\n    status:\n      allocatable:\n        cpu: "${n.cpuAllocatable}"\n        memory: "${n.memoryAllocatable}Mi"`).join('\n')}`,
          success: true,
          commandType: 'get_nodes_yaml',
        };
      }

      const headers = isWide
        ? 'NAME       STATUS   ROLES    AGE   VERSION   INTERNAL-IP   OS-IMAGE\n'
        : 'NAME       STATUS   ROLES    AGE   VERSION\n';

      const rows = state.nodes.map((n) => {
        const namePad = n.name.padEnd(10);
        const statusPad = n.status.padEnd(8);
        const rolePad = n.role.padEnd(8);
        const age = '24d';
        const ver = 'v1.30.0';
        if (isWide) {
          const ip = `192.168.10.${n.laneIndex + 10}`;
          return `${namePad} ${statusPad} ${rolePad} ${age.padEnd(5)} ${ver.padEnd(9)} ${ip.padEnd(13)} Ubuntu 24.04 LTS`;
        }
        return `${namePad} ${statusPad} ${rolePad} ${age.padEnd(5)} ${ver}`;
      });

      return {
        output: headers + rows.join('\n'),
        success: true,
        commandType: isWide ? 'get_nodes_wide' : 'get_nodes',
        parsedObject: { outputFormat: opts.outputFormat },
      };
    }

    // Handle pods
    if (resource === 'pod' || resource === 'pods' || resource === 'po') {
      const specificPodName = args[1] || null;
      const state = this.simulator.getState();

      let targetPods = state.pods;
      if (specificPodName) {
        targetPods = state.pods.filter((p) => p.name === specificPodName);
        if (targetPods.length === 0) {
          return {
            output: `Error from server (NotFound): pods "${specificPodName}" not found in namespace "${state.namespace}"`,
            success: false,
            commandType: 'get_pod_not_found',
            educationalHint: `Pod '${specificPodName}' does not exist yet. Create it using 'kubectl run ${specificPodName} --image=<image>' or 'kubectl apply -f <manifest.yaml>'`,
          };
        }
      }

      if (targetPods.length === 0) {
        return {
          output: `No resources found in ${state.namespace} namespace.`,
          success: true,
          commandType: isWide ? 'get_pods_wide' : 'get_pods',
          parsedObject: { outputFormat: opts.outputFormat },
        };
      }

      if (opts.outputFormat === 'json') {
        const jsonOutput = JSON.stringify(
          {
            apiVersion: 'v1',
            kind: 'PodList',
            items: targetPods.map((p) => ({
              metadata: { name: p.name, namespace: p.namespace },
              spec: { nodeName: p.nodeName, containers: [{ name: p.name, image: p.image, resources: p.resources }] },
              status: { phase: p.phase, conditions: p.conditions, podIP: p.ip },
            })),
          },
          null,
          2
        );
        return { output: jsonOutput, success: true, commandType: 'get_pods_json' };
      }

      const headers = isWide
        ? 'NAME             READY   STATUS             RESTARTS   AGE   IP           NODE       NOMINATED NODE   READINESS GATES\n'
        : 'NAME             READY   STATUS             RESTARTS   AGE\n';

      const rows = targetPods.map((p) => {
        const readyStr = p.ready ? '1/1' : '0/1';
        const ageSeconds = Math.floor((Date.now() - p.creationTimestamp) / 1000);
        const ageStr = `${ageSeconds}s`;
        const nodeStr = p.nodeName || '<none>';
        const ipStr = p.ip || '<none>';

        if (isWide) {
          return `${p.name.padEnd(16)} ${readyStr.padEnd(7)} ${p.status.padEnd(18)} ${String(p.restarts).padEnd(10)} ${ageStr.padEnd(5)} ${ipStr.padEnd(12)} ${nodeStr.padEnd(10)} <none>           <none>`;
        }
        return `${p.name.padEnd(16)} ${readyStr.padEnd(7)} ${p.status.padEnd(18)} ${String(p.restarts).padEnd(10)} ${ageStr}`;
      });

      return {
        output: headers + rows.join('\n'),
        success: true,
        commandType: isWide ? 'get_pods_wide' : 'get_pods',
        parsedObject: { outputFormat: opts.outputFormat },
      };
    }

    return {
      output: `error: the server doesn't have a resource type "${resource}"`,
      success: false,
      commandType: 'get_unknown_resource',
      educationalHint: `Supported resources: 'nodes', 'pods'. Try: kubectl get nodes or kubectl get pods`,
    };
  }

  private handleDescribe(opts: ParsedOptions): CommandResult {
    const args = opts.positionalArgs;
    if (args.length === 0) {
      return {
        output: `error: You must specify the type of resource to describe. E.g. 'kubectl describe node worker-1'`,
        success: false,
        commandType: 'describe_empty',
      };
    }

    const resource = args[0].toLowerCase();
    const name = args[1];

    if (!name) {
      return {
        output: `error: specify resource name. E.g. kubectl describe ${resource} <name>`,
        success: false,
        commandType: 'describe_no_name',
      };
    }

    const state = this.simulator.getState();

    if (resource === 'node' || resource === 'nodes' || resource === 'no') {
      const node = state.nodes.find((n) => n.name === name);
      if (!node) {
        return {
          output: `Error from server (NotFound): nodes "${name}" not found`,
          success: false,
          commandType: 'describe_node_not_found',
        };
      }

      // Calculate actual scheduled pods and accurate resource percentages based on Node Allocatable
      const boundPods = state.pods.filter((p) => p.nodeName === node.name);
      const totalCpuReq = boundPods.reduce((sum, p) => sum + (p.resources.requests?.cpu || 0), 0);
      const totalMemReq = boundPods.reduce((sum, p) => sum + (p.resources.requests?.memory || 0), 0);
      const totalCpuLim = boundPods.reduce((sum, p) => sum + (p.resources.limits?.cpu || p.resources.requests?.cpu || 0), 0);
      const totalMemLim = boundPods.reduce((sum, p) => sum + (p.resources.limits?.memory || p.resources.requests?.memory || 0), 0);

      const cpuReqPercent = Math.round((totalCpuReq / node.cpuAllocatable) * 100);
      const memReqPercent = Math.round((totalMemReq / node.memoryAllocatable) * 100);
      const cpuLimPercent = Math.round((totalCpuLim / node.cpuAllocatable) * 100);
      const memLimPercent = Math.round((totalMemLim / node.memoryAllocatable) * 100);

      const podRows = boundPods.length === 0
        ? '  <none>'
        : boundPods
            .map((p) => {
              const reqCpu = p.resources.requests?.cpu ?? 0.25;
              const reqMem = p.resources.requests?.memory ?? 256;
              const limCpu = p.resources.limits?.cpu ?? reqCpu;
              const limMem = p.resources.limits?.memory ?? reqMem;
              const pCpuPct = Math.round((reqCpu / node.cpuAllocatable) * 100);
              const pMemPct = Math.round((reqMem / node.memoryAllocatable) * 100);
              return `  ${state.namespace.padEnd(18)} ${p.name.padEnd(18)} ${formatCpu(reqCpu)} (${pCpuPct}%)`.padEnd(52) +
                `${formatCpu(limCpu)}`.padEnd(12) +
                `${formatMemory(reqMem)} (${pMemPct}%)`.padEnd(18) +
                `${formatMemory(limMem)}`;
            })
            .join('\n');

      const output = `Name:               ${node.name}
Roles:              ${node.role}
Labels:             node-role.kubernetes.io/worker=
                    topology.kubernetes.io/zone=lane-${node.laneIndex + 1}
Status:             ${node.status}
Capacity:
  cpu:                ${node.cpuCapacity}
  memory:             ${node.memoryCapacity}Mi
  pods:               20
Allocatable:
  cpu:                ${node.cpuAllocatable}
  memory:             ${node.memoryAllocatable}Mi
  pods:               20
Allocated resources:
  (Total limits may be over 100 percent, but requested resources will not)
  Resource           Requests          Limits
  --------           --------          ------
  cpu                ${formatCpu(totalCpuReq)} (${cpuReqPercent}%)        ${formatCpu(totalCpuLim)} (${cpuLimPercent}%)
  memory             ${formatMemory(totalMemReq)} (${memReqPercent}%)      ${formatMemory(totalMemLim)} (${memLimPercent}%)
Non-terminated Pods: (${boundPods.length} pods)
  Namespace          Name               CPU Requests  CPU Limits  Memory Requests  Memory Limits
  ---------          ----               ------------  ----------  ---------------  -------------
${podRows}
Events:
  Type    Reason     Age   From     Message
  ----    ------     ----  ----     -------
  Normal  NodeReady  24d   kubelet  Node ${node.name} status is now: NodeReady`;

      return {
        output,
        success: true,
        commandType: 'describe_node',
        parsedObject: { nodeName: node.name },
      };
    }

    if (resource === 'pod' || resource === 'pods' || resource === 'po') {
      const pod = state.pods.find((p) => p.name === name);
      if (!pod) {
        return {
          output: `Error from server (NotFound): pods "${name}" not found in namespace "${state.namespace}"`,
          success: false,
          commandType: 'describe_pod_not_found',
        };
      }

      // Filter real events that have actually occurred for this pod
      const podEvents = state.events.filter((e) => e.object === `pod/${pod.name}`);
      const eventsText = podEvents.length === 0
        ? '  <none>'
        : podEvents
            .map((e) => `  ${e.type.padEnd(7)} ${e.reason.padEnd(16)} ${e.timeSeconds}s   ${e.step ? e.step.toLowerCase() : 'kubelet'}   ${e.message}`)
            .join('\n');

      const reqCpu = pod.resources.requests?.cpu ?? 0.25;
      const reqMem = pod.resources.requests?.memory ?? 256;
      const limCpu = pod.resources.limits?.cpu;
      const limMem = pod.resources.limits?.memory;

      const conditionsText = pod.conditions
        .map((c) => `  Type:             ${c.type}\n  Status:           ${c.status}${c.reason ? '\n  Reason:           ' + c.reason : ''}`)
        .join('\n');

      const output = `Name:         ${pod.name}
Namespace:    ${state.namespace}
Priority:     0
Node:         ${pod.nodeName ? `${pod.nodeName}/192.168.10.${(pod.laneIndex || 0) + 10}` : '<none>'}
Status:       ${pod.status}
IP:           ${pod.ip || '<none>'}
Containers:
  ${pod.name}:
    Container ID:   ${pod.status === 'Running' ? `${state.containerRuntime}://${Math.random().toString(36).substring(2, 12)}` : '<none>'}
    Image:          ${pod.normalizedImage.fullName}
    State:          ${pod.status === 'Running' ? 'Running' : pod.status === 'ContainerCreating' ? 'Waiting (ContainerCreating)' : 'Waiting (Pending)'}
    Ready:          ${pod.ready ? 'True' : 'False'}
    Restart Count:  ${pod.restarts}
    Requests:
      cpu:          ${formatCpu(reqCpu)}
      memory:       ${formatMemory(reqMem)}
${limCpu || limMem ? `    Limits:\n${limCpu ? '      cpu:          ' + formatCpu(limCpu) + '\n' : ''}${limMem ? '      memory:       ' + formatMemory(limMem) + '\n' : ''}` : ''}Conditions:
${conditionsText}
Events:
  Type    Reason           Age   From               Message
  ----    ------           ----  ----               -------
${eventsText}`;

      return {
        output,
        success: true,
        commandType: 'describe_pod',
        parsedObject: { name: pod.name, image: pod.image, nodeName: pod.nodeName || undefined },
      };
    }

    return {
      output: `error: the server doesn't have a resource type "${resource}" to describe`,
      success: false,
      commandType: 'describe_unknown',
    };
  }

  private handleRun(opts: ParsedOptions): CommandResult {
    const args = opts.positionalArgs;
    if (args.length === 0) {
      return {
        output: `error: NAME is required for kubectl run\n\nUsage: kubectl run NAME --image=image [flags]`,
        success: false,
        commandType: 'run_no_name',
        educationalHint: `Syntax: kubectl run <pod-name> --image=<image-name>`,
      };
    }

    const podName = args[0];
    const image = opts.image;

    if (!image) {
      return {
        output: `error: flag --image is required\n\nExample: kubectl run ${podName} --image=nginx`,
        success: false,
        commandType: 'run_no_image',
        educationalHint: `You must specify an image with --image=<image>. E.g. kubectl run ${podName} --image=nginx`,
      };
    }

    let cpuReq = 0.25;
    let memReq = 256;

    // Support --overrides if JSON format provided
    if (opts.overrides) {
      try {
        const parsedOverrides = JSON.parse(opts.overrides);
        const container = parsedOverrides?.spec?.containers?.[0];
        if (container?.resources?.requests?.cpu) {
          cpuReq = parseCpuQuantity(container.resources.requests.cpu);
        }
        if (container?.resources?.requests?.memory) {
          memReq = parseMemoryQuantity(container.resources.requests.memory);
        }
      } catch {
        return {
          output: `error: invalid JSON in --overrides flag: ${opts.overrides}`,
          success: false,
          commandType: 'run_invalid_overrides',
        };
      }
    }

    const result = this.simulator.createPod(podName, image, {
      requests: { cpu: cpuReq, memory: memReq },
    });

    return {
      output: result.message,
      success: result.success,
      commandType: 'run_pod',
      parsedObject: {
        name: podName,
        image,
        cpuRequest: cpuReq,
        memoryRequest: memReq,
      },
    };
  }

  private handleApply(opts: ParsedOptions, verb: string): CommandResult {
    const filename = opts.filename;
    if (!filename) {
      return {
        output: `error: must specify one of -f and -k\n\nUsage: kubectl ${verb} -f <filename.yaml>`,
        success: false,
        commandType: 'apply_no_file',
        educationalHint: `Specify the YAML manifest file: kubectl ${verb} -f <filename.yaml>. E.g. kubectl apply -f compute-01.yaml`,
      };
    }

    const manifest = VIRTUAL_MANIFESTS[filename];
    if (!manifest) {
      return {
        output: `error: the path "${filename}" does not exist\nAvailable manifests: ${Object.keys(VIRTUAL_MANIFESTS).join(', ')}`,
        success: false,
        commandType: 'apply_file_not_found',
        educationalHint: `Manifest '${filename}' was not found. Use 'ls' to view available training manifests.`,
      };
    }

    const cpuReq = manifest.cpuRequest ?? 0.25;
    const memReq = manifest.memoryRequest ?? 256;

    const result = this.simulator.createPod(manifest.name, manifest.image, {
      requests: { cpu: cpuReq, memory: memReq },
      limits: manifest.cpuLimit || manifest.memoryLimit ? { cpu: manifest.cpuLimit, memory: manifest.memoryLimit } : undefined,
    });

    return {
      output: result.message,
      success: result.success,
      commandType: 'apply_manifest',
      parsedObject: {
        name: manifest.name,
        image: manifest.image,
        filename,
        cpuRequest: cpuReq,
        memoryRequest: memReq,
      },
    };
  }

  private handleDelete(opts: ParsedOptions): CommandResult {
    const args = opts.positionalArgs;
    if (args.length === 0) {
      return {
        output: `error: You must specify the type of resource to delete. E.g. 'kubectl delete pod web-01'`,
        success: false,
        commandType: 'delete_empty',
      };
    }

    const resource = args[0].toLowerCase();
    const name = args[1];

    if (resource !== 'pod' && resource !== 'pods' && resource !== 'po') {
      return {
        output: `error: unknown resource type "${resource}" for delete. In this level you can delete pods: 'kubectl delete pod <name>'`,
        success: false,
        commandType: 'delete_unsupported',
      };
    }

    if (!name) {
      return {
        output: `error: specify the pod name to delete. E.g. kubectl delete pod web-01`,
        success: false,
        commandType: 'delete_no_name',
      };
    }

    const result = this.simulator.deletePod(name);
    return {
      output: result.message,
      success: result.success,
      commandType: 'delete_pod',
      parsedObject: { name },
    };
  }

  private handleClusterInfo(): CommandResult {
    return {
      output: `Kubernetes control plane is running at https://k8s.training.cluster.local:6443
CoreDNS is running at https://k8s.training.cluster.local:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy`,
      success: true,
      commandType: 'cluster-info',
    };
  }

  private handleExplain(args: string[]): CommandResult {
    const target = (args[0] || '').toLowerCase();
    if (target === 'pod' || target === 'pods') {
      return {
        output: `KIND:     Pod
VERSION:  v1

DESCRIPTION:
    Pod is a collection of containers that can run on a host. This resource is
    created by clients and scheduled onto hosts by the Kubernetes scheduler.`,
        success: true,
        commandType: 'explain_pod',
      };
    }
    if (target === 'node' || target === 'nodes') {
      return {
        output: `KIND:     Node
VERSION:  v1

DESCRIPTION:
    Node is a worker machine in Kubernetes. Each node contains the services
    necessary to run Pods, including kubelet, container runtime, and kube-proxy.`,
        success: true,
        commandType: 'explain_node',
      };
    }
    return {
      output: `Use 'kubectl explain pod' or 'kubectl explain node' to learn about Kubernetes objects.`,
      success: true,
      commandType: 'explain',
    };
  }

  private handleHelp(): CommandResult {
    const output = `========================================================================
       KUBERNETES DEFENSE — BASTION TERMINAL COMMANDS (v1.30.0)
========================================================================

INSPECTION & OBSERVABILITY:
  kubectl get nodes                  List worker nodes, ready status & roles
  kubectl get nodes -o wide          List nodes with IP addresses & OS details
  kubectl describe node <name>       Detailed allocatable resources & pod allocations
  kubectl get pods                   List active workloads in namespace
  kubectl get pods -o wide           List pods with assigned worker node & IP
  kubectl describe pod <name>        Inspect pod lifecycle events & status

WORKLOAD MANAGEMENT (DECLARATIVE & IMPERATIVE):
  kubectl run <name> --image=<image> Deploy a pod (e.g. kubectl run web-01 --image=nginx)
  kubectl apply -f <manifest.yaml>   Apply declarative YAML (e.g. kubectl apply -f compute-01.yaml)
  kubectl delete pod <name>          Delete a pod to reclaim worker resources

FILE INSPECTION:
  ls                                 List available training YAML manifests
  cat <filename.yaml>                View declarative YAML manifest contents

UTILITIES:
  kubectl cluster-info               Display cluster control plane addresses
  kubectl explain pod                Documentation on Kubernetes Pods
  clear (or Ctrl+L)                  Clear terminal screen
  help                               Display this guide
========================================================================`;
    return { output, success: true, commandType: 'help' };
  }
}
