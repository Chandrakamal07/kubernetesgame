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
      title: 'CLI Submits Manifest',
      component: 'Bastion Terminal',
      icon: <Terminal size={14} className="text-[#4F7CFF]" />,
      desc: 'Player runs kubectl command; client-side OpenAPI schemas validate structure.',
      active: true,
      completed: !!latestPod,
    },
    {
      num: 2,
      title: 'API Server Admission',
      component: 'kube-apiserver',
      icon: <Server size={14} className="text-[#6594FF]" />,
      desc: 'Authenticates request, authorizes RBAC permissions, and validates pod spec.',
      active: !!latestPod,
      completed: !!latestPod?.nodeName || latestPod?.status === 'Running',
    },
    {
      num: 3,
      title: 'Cluster State Persisted',
      component: 'etcd Key-Value Store',
      icon: <Database size={14} className="text-[#7765F8]" />,
      desc: `Pod object created in Pending state under /registry/pods/${cluster.namespace}/...`,
      active: !!latestPod,
      completed: !!latestPod?.nodeName || latestPod?.status === 'Running',
    },
    {
      num: 4,
      title: 'Scheduler Filtering & Scoring',
      component: 'kube-scheduler',
      icon: <Cpu size={14} className="text-[#54D98C]" />,
      desc: 'Evaluates candidate worker nodes based on free CPU/RAM and scores optimal placement.',
      active: !!latestPod?.nodeName || latestPod?.status === 'Pending',
      completed: latestPod?.status === 'ContainerCreating' || latestPod?.status === 'Running',
    },
    {
      num: 5,
      title: 'Kubelet Binding & Startup',
      component: 'kubelet + Container Runtime',
      icon: <Box size={14} className="text-[#F2B95F]" />,
      desc: `Kubelet on ${latestPod?.nodeName || 'worker node'} pulls container image and configures cgroups.`,
      active: latestPod?.status === 'ContainerCreating' || latestPod?.status === 'Running',
      completed: latestPod?.status === 'Running',
    },
    {
      num: 6,
      title: 'Workload Running (Ammo Ready)',
      component: 'Container Network (CNI)',
      icon: <CheckCircle2 size={14} className="text-[#54D98C]" />,
      desc: 'Pod reaches Running state with allocated IP. Defense cannon loads plasma ammunition!',
      active: latestPod?.status === 'Running',
      completed: latestPod?.status === 'Running',
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
        Observe how Kubernetes processes your terminal commands internally:
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
          Architectural Insight
        </div>
        <p className="text-[11px] text-[#C6CDDB] bg-[#080B17] p-2.5 rounded-xl border border-[rgba(132,156,205,0.12)] font-sans leading-relaxed">
          The player initiates workloads via <code className="text-[#6594FF] font-mono">kubectl</code>, but the <strong className="text-[#F7F9FF]">kube-scheduler</strong> makes node placement decisions based on CPU & Memory capacity.
        </p>
      </div>
    </div>
  );
};
