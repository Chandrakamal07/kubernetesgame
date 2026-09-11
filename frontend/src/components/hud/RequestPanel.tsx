import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import { User, Tag, Cpu, HardDrive, X, Sparkles } from 'lucide-react';

export const RequestPanel: React.FC = () => {
  const { activeRequest, activeRequestIndex, isRequestPanelOpen, isTutorialActive, actions } = useGameStore();

  if (!isRequestPanelOpen || !activeRequest) {
    return null;
  }

  const isUrgent = activeRequest.characterType === 'urgent' || activeRequest.characterType === 'escalation';

  return (
    <div
      data-tutorial="request-panel"
      className={`w-full bg-[#0D1220]/95 border-b border-[rgba(132,156,205,0.16)] p-4 shadow-lg select-none transition-all ${
        isTutorialActive ? 'opacity-90' : ''
      }`}
    >
      {/* Top Header: Objective Number & Priority Tag */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(132,156,205,0.12)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[#6594FF] tracking-wider">
            OBJECTIVE #{String(activeRequestIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-[#7F8CA3] font-mono">({activeRequest.id})</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border ${
              isUrgent
                ? 'bg-[#F06D78]/15 text-[#F06D78] border-[#F06D78]/35'
                : 'bg-[#32D5D2]/15 text-[#32D5D2] border-[#32D5D2]/35'
            }`}
          >
            {activeRequest.characterType}
          </span>
          <button
            onClick={actions.toggleRequestPanel}
            className="p-1 text-[#7F8CA3] hover:text-[#F7F9FF] hover:bg-[#151E33] rounded transition-colors cursor-pointer"
            title="Minimize Objective Panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Customer Requester Briefing */}
      <div className="flex items-center gap-2.5 mt-3">
        <div className="w-8 h-8 rounded-full bg-[#151E33] border border-[rgba(132,156,205,0.2)] flex items-center justify-center text-[#4F7CFF] shrink-0">
          <User size={15} />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-[#F7F9FF] truncate font-sans">{activeRequest.customerName}</h4>
          <p className="text-[10px] text-[#7F8CA3] truncate font-sans">{activeRequest.customerRole}</p>
        </div>
        <span className="ml-auto text-xs font-mono font-bold text-[#F1C66C] bg-[#F1C66C]/12 border border-[#F1C66C]/25 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
          <Sparkles size={11} />
          <span>+{activeRequest.rewardPoints} XP</span>
        </span>
      </div>

      {/* Request Title & Brief */}
      <div className="mt-3">
        <h3 className="text-xs font-bold text-[#F7F9FF] flex items-center gap-1.5 font-sans">
          <Tag size={12} className="text-[#4F7CFF] shrink-0" />
          <span>{activeRequest.title}</span>
        </h3>
        <p className="text-[11px] text-[#C6CDDB] mt-1.5 leading-relaxed font-sans">{activeRequest.description}</p>
      </div>

      {/* Target Requirements Specifications */}
      <div className="mt-3 p-2.5 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.14)] space-y-1.5 text-[11px] font-mono">
        <div className="text-[9px] text-[#7F8CA3] uppercase font-bold tracking-wider">Specifications:</div>
        
        {activeRequest.requirements.type === 'inspect-nodes' && (
          <div className="flex items-center justify-between text-[#C6CDDB]">
            <span>Action:</span>
            <span className="text-[#6594FF] font-semibold">Inspect cluster nodes</span>
          </div>
        )}

        {activeRequest.requirements.type === 'inspect-pods-wide' && (
          <div className="flex items-center justify-between text-[#C6CDDB]">
            <span>Action:</span>
            <span className="text-[#6594FF] font-semibold">Discover pod worker node (-o wide)</span>
          </div>
        )}

        {activeRequest.requirements.type === 'describe-node' && (
          <div className="flex items-center justify-between text-[#C6CDDB]">
            <span>Target Node:</span>
            <span className="text-[#6594FF] font-semibold">{activeRequest.requirements.nodeName}</span>
          </div>
        )}

        {activeRequest.requirements.podName && (
          <div className="flex items-center justify-between text-[#C6CDDB]">
            <span>Pod Name:</span>
            <span className="text-[#6594FF] font-semibold">{activeRequest.requirements.podName}</span>
          </div>
        )}

        {activeRequest.requirements.image && (
          <div className="flex items-center justify-between text-[#C6CDDB]">
            <span>Image:</span>
            <span className="text-[#54D98C] font-semibold">{activeRequest.requirements.image}</span>
          </div>
        )}

        {activeRequest.requirements.minCpu && (
          <div className="flex items-center justify-between text-[#C6CDDB]">
            <span className="flex items-center gap-1">
              <Cpu size={11} className="text-[#4F7CFF]" />
              <span>CPU:</span>
            </span>
            <span className="text-[#6594FF] font-semibold">{activeRequest.requirements.minCpu * 1000}m</span>
          </div>
        )}

        {activeRequest.requirements.minMem && (
          <div className="flex items-center justify-between text-[#C6CDDB]">
            <span className="flex items-center gap-1">
              <HardDrive size={11} className="text-[#7765F8]" />
              <span>Memory:</span>
            </span>
            <span className="text-[#8B78FF] font-semibold">{activeRequest.requirements.minMem}Mi</span>
          </div>
        )}
      </div>
    </div>
  );
};
