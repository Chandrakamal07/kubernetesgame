import React, { useState } from 'react';
import { useGameStore } from '../../state/useGameStore';
import { Activity, X, Clock } from 'lucide-react';

export const ClusterEventsLog: React.FC = () => {
  const { isEventsLogOpen, cluster, actions } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'warning' | 'normal'>('all');

  if (!isEventsLogOpen) return null;

  const events = cluster.events.filter((evt) => {
    if (filter === 'warning') return evt.type === 'Warning';
    if (filter === 'normal') return evt.type === 'Normal';
    return true;
  });

  return (
    <div className="fixed bottom-16 right-5 w-96 max-h-[380px] bg-[#0D1220]/96 border border-[rgba(132,156,205,0.2)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] p-3.5 z-40 backdrop-blur-2xl flex flex-col select-none animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(132,156,205,0.14)]">
        <div className="flex items-center gap-1.5 text-[#7765F8] font-mono font-bold text-xs">
          <Activity size={14} className="text-[#8B78FF]" />
          <span>CLUSTER AUDIT STREAM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
              filter === 'all'
                ? 'bg-[#7765F8] text-white font-semibold'
                : 'text-[#7F8CA3] hover:text-[#F7F9FF] bg-[#11182A]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
              filter === 'warning'
                ? 'bg-[#F06D78] text-white font-semibold'
                : 'text-[#7F8CA3] hover:text-[#F7F9FF] bg-[#11182A]'
            }`}
          >
            Warnings
          </button>
          <button
            onClick={actions.toggleEventsLog}
            className="text-[#7F8CA3] hover:text-[#F7F9FF] p-1 rounded-md hover:bg-[#151E33] transition-colors ml-1 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mt-2 font-mono text-xs pr-1">
        {events.length === 0 ? (
          <div className="text-[#7F8CA3] text-center py-8 text-xs font-sans">No matching cluster events recorded.</div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className={`p-2.5 rounded-xl border transition-all ${
                evt.type === 'Warning'
                  ? 'bg-[#38161B]/60 border-[#F06D78]/35 text-[#F7F9FF]'
                  : 'bg-[#11182A]/80 border-[rgba(132,156,205,0.12)] text-[#C6CDDB]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-[#7F8CA3]">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>{evt.timestamp}</span>
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                    evt.type === 'Warning'
                      ? 'bg-[#F06D78]/20 text-[#F06D78] border border-[#F06D78]/35'
                      : 'bg-[#54D98C]/15 text-[#54D98C] border border-[#54D98C]/30'
                  }`}
                >
                  {evt.reason}
                </span>
              </div>
              <div className="text-[#4F7CFF] font-semibold mt-1 text-[11px]">{evt.object}</div>
              <div className="text-[#C6CDDB] mt-0.5 text-[11px] leading-snug font-sans">{evt.message}</div>
              {evt.details && <div className="text-[#7F8CA3] text-[10px] mt-1 italic font-sans">{evt.details}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
