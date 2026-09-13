import React, { useState } from 'react';
import { useGameStore } from '../../state/useGameStore';
import { MissionPanel } from '../hud/MissionPanel';
import {
  CheckCircle2,
  Clock,
  Server,
  Search,
} from 'lucide-react';

const GLOSSARY_TERMS = [
  {
    term: 'Cluster',
    meaning: 'A set of connected worker machines (nodes) managed by a central control plane.',
  },
  {
    term: 'Control Plane',
    meaning: 'The collection of control processes (API server, etcd, scheduler) that manage cluster state.',
  },
  {
    term: 'Worker Node',
    meaning: 'A machine with compute capacity (CPU and RAM) that runs containerized workloads.',
  },
  {
    term: 'Pod',
    meaning: 'The smallest deployable unit of computing in Kubernetes, wrapping one or more containers.',
  },
  {
    term: 'Container Image',
    meaning: 'A packaged bundle of an application and its dependencies (e.g. nginx, redis).',
  },
  {
    term: 'kube-scheduler',
    meaning: 'The control plane component that selects eligible worker nodes for newly created pods.',
  },
  {
    term: 'Allocatable Resources',
    meaning: 'The CPU and RAM on a node available for pods after system service reservations.',
  },
  {
    term: 'kube-apiserver',
    meaning: 'The front-end API service that authenticates, validates, and accepts CLI requests.',
  },
  {
    term: 'etcd',
    meaning: 'The consistent distributed key-value store holding the desired state of the cluster.',
  },
  {
    term: 'kubelet',
    meaning: 'The agent running on each worker node that communicates with the container runtime.',
  },
  {
    term: 'YAML Manifest',
    meaning: 'A declarative configuration file describing the desired state of a Kubernetes object.',
  },
];

export const KubernetesActivityPanel: React.FC = () => {
  const { cluster, activeSidebarTab, actions } = useGameStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGlossary = GLOSSARY_TERMS.filter(
    (g) =>
      g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Derive active control plane tracer steps from recent cluster events
  const latestPod = cluster.pods[cluster.pods.length - 1];
  const podEvents = latestPod
    ? cluster.events.filter((e) => e.object === `pod/${latestPod.name}`)
    : [];

  const steps = [
    {
      id: 'API_SERVER_VALIDATING',
      label: '1. API Server Admission',
      desc: 'kube-apiserver validates syntax, authentication, and defaults resource requests.',
      done: podEvents.some((e) => e.step === 'API_SERVER_VALIDATING' || e.reason === 'Created'),
    },
    {
      id: 'ETCD_PERSISTED',
      label: '2. Desired State Persisted',
      desc: 'Object definition written to etcd key-value store.',
      done: podEvents.some((e) => e.step === 'ETCD_PERSISTED' || e.reason === 'Persisted'),
    },
    {
      id: 'SCHEDULER_EVALUATING',
      label: '3. Scheduler Evaluation',
      desc: 'kube-scheduler filters nodes by Allocatable capacity and scores feasible workers.',
      done: podEvents.some(
        (e) => e.step === 'SCHEDULER_EVALUATING' || e.step === 'SCHEDULER_BOUND' || e.reason === 'Scheduled' || e.reason === 'FailedScheduling'
      ),
    },
    {
      id: 'SCHEDULER_BOUND',
      label: '4. Node Binding',
      desc: latestPod?.nodeName
        ? `Bound to ${latestPod.nodeName}.`
        : 'Waiting for node binding...',
      done: !!latestPod?.nodeName,
    },
    {
      id: 'RUNTIME_CONTAINER_STARTING',
      label: '5. Kubelet & Runtime',
      desc: 'Kubelet pulls container image and configures networking sandbox.',
      done: latestPod?.containerState === 'Running' || podEvents.some((e) => e.reason === 'Pulling' || e.reason === 'Started'),
    },
    {
      id: 'POD_READY',
      label: '6. Workload Ready',
      desc: 'Readiness probe succeeds. Pod is Running and ready to serve traffic.',
      done: latestPod?.ready === true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0E1625] text-[#F8FAFC]">
      {/* Navigation Tabs Header */}
      <div className="flex items-center border-b border-[rgba(148,163,184,0.14)] px-3 pt-2 bg-[#070B14]">
        <button
          onClick={() => actions.setActiveSidebarTab('mission')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeSidebarTab === 'mission'
              ? 'border-[#6EA8FE] text-[#6EA8FE]'
              : 'border-transparent text-[#8190A7] hover:text-[#B8C4D6]'
          }`}
        >
          Mission
        </button>
        <button
          onClick={() => actions.setActiveSidebarTab('tracer')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeSidebarTab === 'tracer'
              ? 'border-[#6EA8FE] text-[#6EA8FE]'
              : 'border-transparent text-[#8190A7] hover:text-[#B8C4D6]'
          }`}
        >
          What Kubernetes Is Doing
        </button>
        <button
          onClick={() => actions.setActiveSidebarTab('glossary')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeSidebarTab === 'glossary'
              ? 'border-[#6EA8FE] text-[#6EA8FE]'
              : 'border-transparent text-[#8190A7] hover:text-[#B8C4D6]'
          }`}
        >
          Glossary
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeSidebarTab === 'mission' && <MissionPanel />}

        {activeSidebarTab === 'tracer' && (
          <div className="p-4 space-y-4">
            <div className="border-b border-[rgba(148,163,184,0.14)] pb-2">
              <h3 className="text-sm font-bold text-[#F8FAFC]">What Kubernetes Is Doing</h3>
              <p className="text-xs text-[#8190A7]">
                Live technical trace of the control plane and node lifecycle.
              </p>
            </div>

            {latestPod ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs bg-[#151F31] p-2.5 rounded-lg border border-[rgba(148,163,184,0.1)]">
                  <div>
                    <span className="text-[#8190A7]">Target Workload: </span>
                    <span className="font-mono font-bold text-[#6EA8FE]">{latestPod.name}</span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                      latestPod.ready ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                    }`}
                  >
                    {latestPod.ready ? 'READY 1/1' : latestPod.waitingReason || latestPod.phase}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        step.done
                          ? 'bg-[#151F31] border-[rgba(74,222,128,0.3)] text-[#F8FAFC]'
                          : 'bg-[#0E1625]/60 border-[rgba(148,163,184,0.08)] text-[#8190A7]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#8190A7] shrink-0" />
                        )}
                        <span className="text-xs font-semibold">{step.label}</span>
                      </div>
                      <p className="text-[11px] text-[#B8C4D6] mt-1 pl-6">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-[#8190A7] text-xs space-y-2">
                <Server className="w-8 h-8 mx-auto text-[#6EA8FE]/40" />
                <p>No workloads submitted yet.</p>
                <p className="text-[11px]">Run &quot;kubectl run&quot; or &quot;kubectl apply&quot; to see the live control plane trace.</p>
              </div>
            )}
          </div>
        )}

        {activeSidebarTab === 'glossary' && (
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#8190A7]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Kubernetes terms..."
                className="w-full bg-[#151F31] border border-[rgba(148,163,184,0.14)] rounded-lg pl-8 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#8190A7] focus:outline-none focus:border-[#6EA8FE]"
              />
            </div>

            <div className="space-y-2">
              {filteredGlossary.map((item, idx) => (
                <div key={idx} className="bg-[#151F31] p-3 rounded-xl border border-[rgba(148,163,184,0.1)] space-y-1">
                  <span className="font-mono font-bold text-xs text-[#5EEAD4]">{item.term}</span>
                  <p className="text-xs text-[#B8C4D6] leading-relaxed">{item.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KubernetesActivityPanel;
