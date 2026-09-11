import React, { useState } from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  Shield,
  Play,
  Layers,
  HelpCircle,
  Terminal,
  Cpu,
  BookOpen,
  Sparkles,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { TutorialModal } from '../modals/TutorialModal';

export const HomeScreen: React.FC = () => {
  const { actions } = useGameStore();
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050711] text-[#F7F9FF] flex flex-col justify-between select-none relative overflow-hidden">
      {/* Rich Ambient Background Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#4F7CFF]/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[400px] bg-[#7765F8]/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-16 left-10 w-[450px] h-[350px] bg-[#32D5D2]/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[rgba(132,156,205,0.16)] z-10 backdrop-blur-xl bg-[#050711]/75">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4F7CFF] to-[#7765F8] flex items-center justify-center text-white shadow-md shadow-[#4F7CFF]/30 border border-[rgba(255,255,255,0.2)]">
            <Shield size={19} />
          </div>
          <div>
            <span className="font-mono font-bold text-sm sm:text-base text-[#F7F9FF] tracking-wider">KUBERNETES DEFENSE</span>
            <span className="text-[10px] text-[#4F7CFF] font-mono block tracking-wide">STRATEGY & LEARNING SIMULATOR</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={actions.startTutorial}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#4F7CFF]/15 hover:bg-[#4F7CFF]/25 border border-[#4F7CFF]/40 text-[#6594FF] text-xs font-mono font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm shadow-[#4F7CFF]/15"
          >
            <GraduationCap size={14} />
            <span>INTERACTIVE TUTORIAL</span>
          </button>

          <button
            onClick={() => setIsTutorialModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11182A] hover:bg-[#1B2640] border border-[rgba(132,156,205,0.16)] text-[#C6CDDB] hover:text-[#F7F9FF] text-xs font-mono transition-colors cursor-pointer"
          >
            <HelpCircle size={14} className="text-[#7F8CA3]" />
            <span className="hidden sm:inline">REFERENCE GUIDE</span>
          </button>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4F7CFF]/15 border border-[#4F7CFF]/35 text-[#6594FF] text-xs font-mono mb-6 shadow-sm">
          <Sparkles size={13} className="text-[#4F7CFF]" />
          <span>Interactive Kubernetes Strategy Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F7F9FF] leading-tight font-sans">
          Learn the Cluster.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7CFF] via-[#7765F8] to-[#32D5D2]">
            Defend the Workload.
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-sm sm:text-base text-[#C6CDDB] leading-relaxed font-sans">
          Incoming technical requests hit your Kubernetes ingress lanes. Deploy container workloads via an authentic Bastion terminal, observe realistic Kube-Scheduler decisions, and power up worker node defense cannons to protect your cluster!
        </p>

        {/* Primary Call to Action Group */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            onClick={actions.startTutorial}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#4F7CFF] via-[#6594FF] to-[#7765F8] hover:from-[#6594FF] hover:to-[#8B78FF] text-white font-mono font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-[#4F7CFF]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <GraduationCap size={18} />
            <span>START GUIDED TUTORIAL</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => actions.startLevel(1, 1)}
            className="px-6 py-3.5 rounded-xl bg-[#11182A] hover:bg-[#1B2640] border border-[rgba(132,156,205,0.2)] hover:border-[#4F7CFF]/50 text-[#F7F9FF] font-mono font-bold text-sm flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-black/30"
          >
            <Play size={15} className="fill-[#F7F9FF]" />
            <span>START LEVEL 1</span>
          </button>

          <button
            onClick={() => actions.setScreen('chapter-map')}
            className="px-5 py-3.5 rounded-xl bg-[#0D1220] hover:bg-[#11182A] border border-[rgba(132,156,205,0.16)] hover:border-[rgba(132,156,205,0.3)] text-[#C6CDDB] hover:text-[#F7F9FF] font-mono font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Layers size={15} className="text-[#7F8CA3]" />
            <span>CAMPAIGN MAP</span>
          </button>
        </div>

        {/* Feature Featurettes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-14 text-left w-full">
          <div className="p-5 bg-[#11182A]/90 border border-[rgba(132,156,205,0.16)] rounded-2xl hover:border-[#4F7CFF]/50 hover:bg-[#151E33] transition-all shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#4F7CFF]/15 text-[#4F7CFF] flex items-center justify-center mb-3.5 border border-[#4F7CFF]/30">
              <Terminal size={19} />
            </div>
            <h3 className="text-sm font-bold text-[#F7F9FF] font-sans">Authentic Kubernetes CLI</h3>
            <p className="text-xs text-[#C6CDDB] mt-1.5 leading-relaxed font-sans">
              Execute <code className="text-[#6594FF] font-mono">kubectl get nodes</code>, <code className="text-[#6594FF] font-mono">kubectl get pods -o wide</code>, and <code className="text-[#6594FF] font-mono">kubectl run</code> with tabular output, tab completion, and history.
            </p>
          </div>

          <div className="p-5 bg-[#11182A]/90 border border-[rgba(132,156,205,0.16)] rounded-2xl hover:border-[#54D98C]/50 hover:bg-[#151E33] transition-all shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#54D98C]/15 text-[#54D98C] flex items-center justify-center mb-3.5 border border-[#54D98C]/30">
              <Cpu size={19} />
            </div>
            <h3 className="text-sm font-bold text-[#F7F9FF] font-sans">Visual Kube-Scheduler</h3>
            <p className="text-xs text-[#C6CDDB] mt-1.5 leading-relaxed font-sans">
              Watch the scheduler evaluate node CPU and Memory capacities in real time and automatically assign workloads to eligible workers.
            </p>
          </div>

          <div className="p-5 bg-[#11182A]/90 border border-[rgba(132,156,205,0.16)] rounded-2xl hover:border-[#7765F8]/50 hover:bg-[#151E33] transition-all shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#7765F8]/15 text-[#8B78FF] flex items-center justify-center mb-3.5 border border-[#7765F8]/30">
              <BookOpen size={19} />
            </div>
            <h3 className="text-sm font-bold text-[#F7F9FF] font-sans">Live Control Plane Trace</h3>
            <p className="text-xs text-[#C6CDDB] mt-1.5 leading-relaxed font-sans">
              Step-by-step trace of Kubernetes control-plane operations: kube-apiserver, etcd persistence, Kubelet cgroup creation, and Pod running lifecycle.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[rgba(132,156,205,0.16)] text-center text-xs text-[#7F8CA3] font-mono z-10 bg-[#050711]/80">
        Kubernetes Defense • Educational Strategy Simulation • React, TypeScript & Web Audio
      </footer>

      <TutorialModal isOpen={isTutorialModalOpen} onClose={() => setIsTutorialModalOpen(false)} />
    </div>
  );
};
