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

    if (first !== 'kubectl' && first !== 'oc') {
      return {
        output: `bash: ${first}: command not found\n\nHint: You are in a Kubernetes bastion host. Use 'kubectl' (or 'oc') commands, e.g. 'kubectl get nodes' or 'kubectl get pods'. Type 'help' for examples.`,
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
    const rest = tokens.slice(2);

    switch (verb) {
      case 'get':
        return this.handleGet(rest);
      case 'describe':
        return this.handleDescribe(rest);
      case 'run':
        return this.handleRun(rest);
      case 'delete':
        return this.handleDelete(rest);
      case 'status':
        return this.handleStatus();
      case 'cluster-info':
        return this.handleClusterInfo();
      case 'whoami':
        return { output: 'student@k8s.training.cluster.local', success: true, commandType: 'whoami' };
      case 'project':
      case 'ns':
      case 'namespace':
        return { output: `Active namespace "${this.simulator.getState().namespace}" on cluster "k8s.training.cluster.local:6443".`, success: true, commandType: 'namespace' };
      case 'explain':
        return this.handleExplain(rest);
      default:
        return {
          output: `error: unknown command "${verb}" for "kubectl"\n\nDid you mean:\n  kubectl get\n  kubectl describe\n  kubectl run\n  kubectl delete`,
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

  private handleGet(args: string[]): CommandResult {
    if (args.length === 0) {
      return {
        output: `error: You must specify the type of resource to get. E.g. 'kubectl get nodes' or 'kubectl get pods'`,
        success: false,
        commandType: 'get_empty',
        educationalHint: `Specify the resource type, like: kubectl get nodes or kubectl get pods`,
      };
    }

    const resource = args[0].toLowerCase();
    const isWide = args.some((a) => a === '-o=wide' || a === '-o' || a === 'wide');

    // Handle nodes
    if (resource === 'node' || resource === 'nodes' || resource === 'no') {
      const state = this.simulator.getState();
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
      };
    }

    // Handle pods
    if (resource === 'pod' || resource === 'pods' || resource === 'po') {
      const specificPodName = args[1] && !args[1].startsWith('-') ? args[1] : null;
      const state = this.simulator.getState();

      let targetPods = state.pods;
      if (specificPodName) {
        targetPods = state.pods.filter((p) => p.name === specificPodName);
        if (targetPods.length === 0) {
          return {
            output: `Error from server (NotFound): pods "${specificPodName}" not found in namespace "${state.namespace}"`,
            success: false,
            commandType: 'get_pod_not_found',
            educationalHint: `Pod '${specificPodName}' does not exist yet. Create it using 'kubectl run ${specificPodName} --image=<image>'`,
          };
        }
      }

      if (targetPods.length === 0) {
        return {
          output: `No resources found in ${state.namespace} namespace.`,
          success: true,
          commandType: isWide ? 'get_pods_wide' : 'get_pods',
        };
      }

      const headers = isWide
        ? 'NAME             READY   STATUS             RESTARTS   AGE   IP           NODE       NOMINATED NODE   READINESS GATES\n'
        : 'NAME             READY   STATUS             RESTARTS   AGE\n';

      const rows = targetPods.map((p) => {
        const readyStr = p.status === 'Running' ? '1/1' : '0/1';
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
      };
    }

    return {
      output: `error: the server doesn't have a resource type "${resource}"`,
      success: false,
      commandType: 'get_unknown_resource',
      educationalHint: `Supported resources: 'nodes', 'pods'. Try: kubectl get nodes or kubectl get pods`,
    };
  }

  private handleDescribe(args: string[]): CommandResult {
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
  cpu:                ${node.cpuCapacity}
  memory:             ${node.memoryCapacity}Mi
  pods:               20
Allocated resources:
  (Total limits may be over 100 percent, but requested resources will not)
  Resource           Requests          Limits
  --------           --------          ------
  cpu                ${node.cpuAllocated.toFixed(2)} (${Math.round((node.cpuAllocated / node.cpuCapacity) * 100)}%)    ${node.cpuAllocated.toFixed(2)}
  memory             ${node.memoryAllocated}Mi (${Math.round((node.memoryAllocated / node.memoryCapacity) * 100)}%)  ${node.memoryAllocated}Mi
Non-terminated Pods: (${node.pods.length} pods)
  Namespace          Name               CPU Requests  CPU Limits  Memory Requests  Memory Limits
  ---------          ----               ------------  ----------  ---------------  -------------
${node.pods.map((p) => `  ${state.namespace.padEnd(18)} ${p.padEnd(18)} 250m (12%)     250m        256Mi (6%)       256Mi`).join('\n') || '  <none>'}
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

      const output = `Name:         ${pod.name}
Namespace:    ${state.namespace}
Priority:     0
Node:         ${pod.nodeName || '<none>'}/${pod.nodeName ? '192.168.10.x' : '<none>'}
Status:       ${pod.status}
IP:           ${pod.ip || '<none>'}
Containers:
  ${pod.name}:
    Container ID:   containerd://${Math.random().toString(36).substring(2, 12)}
    Image:          docker.io/library/${pod.image}:latest
    Image ID:       docker.io/library/${pod.image}@sha256:abcd1234
    State:          ${pod.status === 'Running' ? 'Running' : 'Waiting'}
    Ready:          ${pod.status === 'Running' ? 'True' : 'False'}
    Restart Count:  ${pod.restarts}
    Requests:
      cpu:          ${pod.cpuRequest * 1000}m
      memory:       ${pod.memoryRequest}Mi
Conditions:
  Type              Status
  Initialized       True
  Ready             ${pod.status === 'Running' ? 'True' : 'False'}
  ContainersReady   ${pod.status === 'Running' ? 'True' : 'False'}
  PodScheduled      ${pod.nodeName ? 'True' : 'False'}
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  15s   default-scheduler  Successfully assigned ${state.namespace}/${pod.name} to ${pod.nodeName || 'worker-2'}
  Normal  Pulling    12s   kubelet            Pulling image "${pod.image}"
  Normal  Pulled     10s   kubelet            Successfully pulled image "${pod.image}" in 1.8s
  Normal  Created    8s    kubelet            Created container ${pod.name}
  Normal  Started    7s    kubelet            Started container ${pod.name}`;

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

  private handleRun(args: string[]): CommandResult {
    if (args.length === 0) {
      return {
        output: `error: NAME is required for kubectl run\n\nUsage: kubectl run NAME --image=image [--requests=cpu=...,memory=...]`,
        success: false,
        commandType: 'run_no_name',
        educationalHint: `Syntax: kubectl run <pod-name> --image=<image-name>`,
      };
    }

    const podName = args[0];
    let image = '';
    let cpuRequest = 0.25;
    let memoryRequest = 256;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--image=')) {
        image = arg.replace('--image=', '');
      } else if (arg === '--image' && i + 1 < args.length) {
        image = args[++i];
      } else if (arg.startsWith('--requests=')) {
        const reqStr = arg.replace('--requests=', '');
        const parts = reqStr.split(',');
        parts.forEach((p) => {
          if (p.startsWith('cpu=')) {
            const cpuVal = p.replace('cpu=', '');
            cpuRequest = cpuVal.endsWith('m') ? parseInt(cpuVal) / 1000 : parseFloat(cpuVal);
          } else if (p.startsWith('memory=')) {
            const memVal = p.replace('memory=', '');
            memoryRequest = memVal.endsWith('Gi') ? parseInt(memVal) * 1024 : parseInt(memVal.replace('Mi', ''));
          }
        });
      }
    }

    if (!image) {
      return {
        output: `error: flag --image is required\n\nExample: kubectl run ${podName} --image=nginx`,
        success: false,
        commandType: 'run_no_image',
        educationalHint: `You must specify an image with --image=<image>. E.g. kubectl run ${podName} --image=nginx`,
      };
    }

    const result = this.simulator.createPod(podName, image, cpuRequest, memoryRequest);
    return {
      output: result.message,
      success: result.success,
      commandType: 'run_pod',
      parsedObject: {
        name: podName,
        image,
        cpuRequest,
        memoryRequest,
      },
    };
  }

  private handleDelete(args: string[]): CommandResult {
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

  private handleStatus(): CommandResult {
    const state = this.simulator.getState();
    return {
      output: `Kubernetes Cluster: ${state.clusterName} (Namespace: ${state.namespace})
Control Plane: https://k8s.training.cluster.local:6443

Cluster Health: ${state.health}%
Worker Nodes: 3 Ready (worker-1, worker-2, worker-3)
Active Pods: ${state.pods.length}

Use 'kubectl get pods' to view pods or 'kubectl get nodes' to view nodes.`,
      success: true,
      commandType: 'status',
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
    const output = `===============================================================
       KUBERNETES DEFENSE — BASTION TERMINAL COMMANDS
===============================================================

INSPECTION:
  kubectl get nodes                  List all worker nodes & ready status
  kubectl get nodes -o wide          List nodes with IP addresses & OS details
  kubectl describe node <name>       Detailed CPU/Memory capacity & allocation
  kubectl get pods                   List active workloads in namespace
  kubectl get pods -o wide           List pods with assigned worker node & IP
  kubectl describe pod <name>        Inspect pod lifecycle events & status

WORKLOAD MANAGEMENT:
  kubectl run <name> --image=<image> Deploy a pod (e.g. kubectl run web-01 --image=nginx)
  kubectl run <name> --image=<image> --requests=cpu=500m,memory=1024Mi
  kubectl delete pod <name>          Delete a pod to free worker resources

UTILITIES:
  kubectl cluster-info               Display cluster control plane addresses
  kubectl explain pod                Documentation on Kubernetes Pods
  clear (or Ctrl+L)                  Clear terminal screen
  help                               Display this guide
===============================================================`;
    return { output, success: true, commandType: 'help' };
  }
}
