import React from 'react';
import { HelpCircle, X, Shield, Terminal, Cpu, Zap, ArrowRight } from 'lucide-react';

export const TutorialModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#050711]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0D1220] border border-[#4F7CFF]/45 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(79,124,255,0.18)] p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(132,156,205,0.16)]">
          <div className="flex items-center gap-2 text-[#4F7CFF] font-mono font-bold text-sm">
            <HelpCircle size={17} />
            <span>KUBERNETES DEFENSE — FIELD REFERENCE GUIDE</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7F8CA3] hover:text-[#F7F9FF] rounded-lg hover:bg-[#151E33] transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Metaphor Briefing */}
          <div className="p-4 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)]">
            <h3 className="text-xs font-bold font-mono text-[#6594FF] uppercase tracking-wide flex items-center gap-1.5">
              <Zap size={14} className="text-[#4F7CFF]" />
              1. The Cluster Defense Metaphor
            </h3>
            <p className="text-xs text-[#C6CDDB] mt-1.5 leading-relaxed font-sans">
              In <strong className="text-[#F7F9FF]">Kubernetes Defense</strong>, incoming customer requests travel down ingress lanes. The worker node cannons represent cluster computing and service capacity — running workloads generate defense ammunition that fires and resolves requests before SLA breach.
            </p>
          </div>

          {/* Core Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)] text-center">
              <div className="w-8 h-8 rounded-lg bg-[#4F7CFF]/15 text-[#4F7CFF] flex items-center justify-center mx-auto mb-2.5 border border-[#4F7CFF]/30">
                <Terminal size={15} />
              </div>
              <div className="text-xs font-bold text-[#F7F9FF] font-sans">1. Bastion Terminal</div>
              <p className="text-[11px] text-[#7F8CA3] mt-1 font-sans leading-normal">
                Enter real <code className="text-[#6594FF] font-mono">kubectl</code> commands to create, inspect, and schedule workloads.
              </p>
            </div>

            <div className="p-3.5 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)] text-center">
              <div className="w-8 h-8 rounded-lg bg-[#54D98C]/15 text-[#54D98C] flex items-center justify-center mx-auto mb-2.5 border border-[#54D98C]/30">
                <Cpu size={15} />
              </div>
              <div className="text-xs font-bold text-[#F7F9FF] font-sans">2. Kube-Scheduler</div>
              <p className="text-[11px] text-[#7F8CA3] mt-1 font-sans leading-normal">
                Automatically scores worker nodes and places containers based on free CPU and RAM limits.
              </p>
            </div>

            <div className="p-3.5 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)] text-center">
              <div className="w-8 h-8 rounded-lg bg-[#7765F8]/15 text-[#8B78FF] flex items-center justify-center mx-auto mb-2.5 border border-[#7765F8]/30">
                <Shield size={15} />
              </div>
              <div className="text-xs font-bold text-[#F7F9FF] font-sans">3. Worker Cannons</div>
              <p className="text-[11px] text-[#7F8CA3] mt-1 font-sans leading-normal">
                When a pod reaches <span className="text-[#54D98C] font-semibold">Running</span>, the node cannon loads plasma ammo and fires at incoming traffic!
              </p>
            </div>
          </div>

          {/* Key Commands Table */}
          <div className="p-4 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)]">
            <h3 className="text-xs font-bold font-mono text-[#F2B95F] uppercase tracking-wide mb-2.5">
              Essential Kubernetes Commands:
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between bg-[#11182A] p-2.5 rounded-lg border border-[rgba(132,156,205,0.12)]">
                <span className="text-[#6594FF] font-semibold">kubectl get nodes</span>
                <span className="text-[#7F8CA3] text-[11px] font-sans">List worker nodes & status</span>
              </div>
              <div className="flex items-center justify-between bg-[#11182A] p-2.5 rounded-lg border border-[rgba(132,156,205,0.12)]">
                <span className="text-[#6594FF] font-semibold">kubectl get pods -o wide</span>
                <span className="text-[#7F8CA3] text-[11px] font-sans">Display pod placements & node mappings</span>
              </div>
              <div className="flex items-center justify-between bg-[#11182A] p-2.5 rounded-lg border border-[rgba(132,156,205,0.12)]">
                <span className="text-[#6594FF] font-semibold">kubectl run &lt;name&gt; --image=&lt;image&gt;</span>
                <span className="text-[#7F8CA3] text-[11px] font-sans">Deploy container workload</span>
              </div>
              <div className="flex items-center justify-between bg-[#11182A] p-2.5 rounded-lg border border-[rgba(132,156,205,0.12)]">
                <span className="text-[#6594FF] font-semibold">kubectl describe node worker-2</span>
                <span className="text-[#7F8CA3] text-[11px] font-sans">Inspect allocated CPU & RAM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 text-right pt-3 border-t border-[rgba(132,156,205,0.16)]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-[#4F7CFF] to-[#7765F8] hover:from-[#6594FF] hover:to-[#8B78FF] text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-[#4F7CFF]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>GOT IT — READY TO PLAY</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
