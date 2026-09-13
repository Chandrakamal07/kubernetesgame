import React, { useState } from 'react';
import { useGameStore } from '../../state/useGameStore';
import { Activity, X, Search } from 'lucide-react';

export const ClusterEventsLog: React.FC = () => {
  const { cluster, isEventsLogOpen, actions } = useGameStore();
  const [filterType, setFilterType] = useState<'ALL' | 'Normal' | 'Warning'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isEventsLogOpen) return null;

  const events = cluster.events.filter((e) => {
    const matchesType = filterType === 'ALL' || e.type === filterType;
    const matchesSearch =
      e.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0E1625] border border-[rgba(148,163,184,0.14)] rounded-2xl max-w-2xl w-full h-[540px] flex flex-col shadow-2xl text-[#F8FAFC]">
        {/* Header */}
        <div className="p-4 border-b border-[rgba(148,163,184,0.14)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#6EA8FE]" />
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">Cluster Events Log</h3>
              <p className="text-[11px] text-[#8190A7]">
                Live chronological events from API server, scheduler, and kubelets.
              </p>
            </div>
          </div>
          <button
            onClick={actions.toggleEventsLog}
            className="p-1 rounded-lg hover:bg-[#151F31] text-[#8190A7] hover:text-[#F8FAFC]"
            aria-label="Close Events Log"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 bg-[#070B14] border-b border-[rgba(148,163,184,0.1)] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8190A7]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search event messages or objects..."
              className="w-full bg-[#151F31] border border-[rgba(148,163,184,0.14)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#8190A7] focus:outline-none"
            />
          </div>
          <div className="flex items-center bg-[#151F31] p-0.5 rounded-lg border border-[rgba(148,163,184,0.1)] text-xs">
            {(['ALL', 'Normal', 'Warning'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterType === t
                    ? 'bg-[#6EA8FE] text-[#070B14] font-bold'
                    : 'text-[#8190A7] hover:text-[#F8FAFC]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Events Table / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {events.length === 0 ? (
            <div className="text-center py-12 text-[#8190A7]">No matching cluster events found.</div>
          ) : (
            events.map((e) => (
              <div
                key={e.id}
                className={`p-2.5 rounded-lg border flex items-start gap-3 ${
                  e.type === 'Warning'
                    ? 'bg-[#FB7185]/10 border-[#FB7185]/30'
                    : 'bg-[#151F31] border-[rgba(148,163,184,0.08)]'
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    e.type === 'Warning' ? 'bg-[#FB7185]/20 text-[#FB7185]' : 'bg-[#4ADE80]/20 text-[#4ADE80]'
                  }`}
                >
                  {e.type}
                </span>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#6EA8FE]">{e.reason}</span>
                    <span className="text-[#8190A7]">{e.timestamp} ({e.timeSeconds}s ago)</span>
                  </div>
                  <div className="text-[#B8C4D6] text-xs">{e.message}</div>
                  <div className="text-[10px] text-[#8190A7]">{e.object}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClusterEventsLog;
