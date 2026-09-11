import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  Terminal,
  Server,
  Database,
  Cpu,
  Box,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const LearningView: React.FC = () => {
  const { isLearningViewOpen, isTutorialActive, cluster } = useGameStore();

  if (!isLearningViewOpen) return null;

  const latestPod = cluster.pods[cluster.pods.length - 1];

  const steps = [
    {
      num: 1,
      title: '1. User Expresses Intent',
      component: 'Bastion Terminal (kubectl)',
      icon: <Terminal size={14} className="text-[#4F7CFF]" />,
      desc: 'Player runs kubectl command or applies YAML. Client constructs request to API server.',
      active: true,
      completed: !!latestPod,
    },
    {
      num: 2,
      title: '2. Authentication & Admission',
      component: 'kube-apiserver',
      icon: <Server size={14} className="text-[#6594FF]" />,
      desc: 'API server authenticates, authorizes, applies admission defaulting and validates schema.',
      active: !!latestPod,
      completed: !!latestPod?.nodeName || latestPod?.status === 'Running',
    },
    {
      num: 3,
      title: '3. Desired State Persisted',
      component: 'etcd Key-Value Store',
      icon: <Database size={14} className="text-[#7765F8]" />,
      desc: 'API server persists the Pod object in desired cluster state backed by etcd.',
      active: !!latestPod,
      completed: !!latestPod?.nodeName || latestPod?.status === 'Running',
    },
    {
      num: 4,
      title: '4. Filter & Score Placement',
      component: 'kube-scheduler',
      icon: <Cpu size={14} className="text-[#54D98C]" />,
      desc: 'Watches for unscheduled Pods, filters candidate Nodes by Allocatable capacity, and scores placement.',
      active: !!latestPod?.nodeName || latestPod?.status === 'Pending',
      completed: latestPod?.status === 'ContainerCreating' || latestPod?.status === 'Running',
    },
    {
      num: 5,
      title: '5. Kubelet & Container Runtime',
      component: `kubelet + ${cluster.containerRuntime}`,
      icon: <Box size={14} className="text-[#F2B95F]" />,
      desc: `Kubelet on ${latestPod?.nodeName || 'worker node'} sets up sandbox/network and pulls image via ${cluster.containerRuntime}.`,
      active: latestPod?.status === 'ContainerCreating' || latestPod?.status === 'Running',
      completed: latestPod?.status === 'Running',
    },
    {
      num: 6,
      title: '6. Running & Ready Status',
      component: 'Workload Ready (Pod IP Assigned)',
      icon: <CheckCircle2 size={14} className="text-[#54D98C]" />,
      desc: 'Container starts, readiness succeeds, and the Pod becomes Ready to serve traffic.',
      active: latestPod?.status === 'Running' && latestPod?.ready,
      completed: latestPod?.status === 'Running' && latestPod?.ready,
    },
  ];

  return (
    <div
      className={`p-4 flex flex-col select-none border-t border-[rgba(132,156,205,0.16)] transition-all ${
        isTutorialActive ? 'opacity-85' : ''
      }`}
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(132,156,205,0.12)]">
        <div className="flex items-center gap-1.5 text-[#4F7CFF] text-xs font-mono font-semibold">
          <Info size={13} />
          <span>CONTROL PLANE TRACE</span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-[#4F7CFF]/15 text-[#6594FF] text-[10px] font-mono border border-[#4F7CFF]/35 font-semibold">
          LIVE
        </span>
      </div>

      <p className="text-[11px] text-[#7F8CA3] mt-2 leading-relaxed font-sans">
        Observe how Kubernetes processes your requests asynchronously through the control plane:
      </p>

      {/* Step Pipeline List */}
      <div className="mt-3 space-y-2">
        {steps.map((step) => {
          const isCurrentActive = step.active && !step.completed;
          const isFinished = step.completed;

          return (
            <div
              key={step.num}
              className={`p-2.5 rounded-xl border transition-all ${
                isFinished
                  ? 'bg-[#11182A]/90 border-[rgba(84,217,140,0.35)] shadow-sm'
                  : isCurrentActive
                  ? 'bg-[#151E33] border-[#4F7CFF]/60 shadow-md shadow-[#4F7CFF]/15'
                  : 'bg-[#080B17]/60 border-[rgba(132,156,205,0.08)] opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center border ${
                      isFinished
                        ? 'bg-[#54D98C]/20 text-[#54D98C] border-[#54D98C]/40'
                        : isCurrentActive
                        ? 'bg-[#4F7CFF]/20 text-[#6594FF] border-[#4F7CFF]/40'
                        : 'bg-[#11182A] text-[#7F8CA3] border-[rgba(132,156,205,0.2)]'
                    }`}
                  >
                    {step.num}
                  </span>
                  <span className="text-xs font-semibold text-[#F7F9FF] font-sans">{step.title}</span>
                </div>
                {step.icon}
              </div>

              <div className="text-[10px] font-mono text-[#4F7CFF] mt-1 pl-6">{step.component}</div>
              <p className="text-[10px] text-[#C6CDDB] mt-1 leading-normal pl-6 font-sans">{step.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Architectural Insight Callout */}
      <div className="mt-4 pt-3 border-t border-[rgba(132,156,205,0.12)]">
        <div className="text-[9px] font-mono uppercase tracking-wider text-[#7F8CA3] font-bold mb-1.5">
          Kubernetes Architectural Rule
        </div>
        <p className="text-[11px] text-[#C6CDDB] bg-[#080B17] p-2.5 rounded-xl border border-[rgba(132,156,205,0.12)] font-sans leading-relaxed">
          A successful <code className="text-[#6594FF] font-mono">kubectl</code> command creates the API object in etcd, but workloads only serve traffic once <strong className="text-[#F7F9FF]">Running & Ready</strong>.
        </p>
      </div>
    </div>
  );
};
