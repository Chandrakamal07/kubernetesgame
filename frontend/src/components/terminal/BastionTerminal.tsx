import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  Terminal as TerminalIcon,
  Play,
  Trash2,
  Copy,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react';

const AUTOCOMPLETE_SUGGESTIONS = [
  'kubectl get nodes',
  'kubectl get nodes -o wide',
  'kubectl get pods',
  'kubectl get pods -o wide',
  'kubectl describe node worker-1',
  'kubectl describe node worker-2',
  'kubectl describe node worker-3',
  'kubectl describe pod web-01',
  'kubectl describe pod compute-01',
  'kubectl describe pod big-cache',
  'kubectl run web-01 --image=nginx',
  'kubectl apply -f compute-01.yaml',
  'kubectl apply -f db-01.yaml',
  'kubectl apply -f big-cache.yaml',
  'kubectl delete pod big-cache',
  'kubectl cluster-info',
  'kubectl explain pod',
  'kubectl explain node',
  'ls',
  'cat compute-01.yaml',
  'cat db-01.yaml',
  'cat big-cache.yaml',
  'clear',
  'help',
];

export const BastionTerminal: React.FC = () => {
  const {
    terminalHistory,
    terminalInputToInsert,
    isTerminalExpanded,
    activeMission,
    actions,
  } = useGameStore();

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize inserted terminal commands from MissionPanel / HintModal
  useEffect(() => {
    if (terminalInputToInsert !== null) {
      // oxlint-disable-next-line react/set-state-in-effect
      setInput(terminalInputToInsert);
      actions.clearTerminalInputInsert();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [terminalInputToInsert, actions]);

  // Auto-scroll terminal to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const handleExecute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    actions.executeCommand(cmd);
    setInput('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Arrow Up: Previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const validHistory = terminalHistory.filter((h) => !h.command.startsWith('#'));
      if (validHistory.length === 0) return;

      const nextIdx = historyIndex === -1 ? validHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(validHistory[nextIdx].command);
    }
    // Arrow Down: Next command
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const validHistory = terminalHistory.filter((h) => !h.command.startsWith('#'));
      if (historyIndex === -1) return;

      const nextIdx = historyIndex + 1;
      if (nextIdx >= validHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIdx);
        setInput(validHistory[nextIdx].command);
      }
    }
    // Tab: Autocomplete
    else if (e.key === 'Tab') {
      e.preventDefault();
      const trimmed = input.trim().toLowerCase();
      if (!trimmed) return;

      const match = AUTOCOMPLETE_SUGGESTIONS.find((s) => s.toLowerCase().startsWith(trimmed));
      if (match) {
        setInput(match);
      }
    }
  };

  const copyScrollback = () => {
    const text = terminalHistory.map((h) => `$ ${h.command}\n${h.output}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#070B14] font-mono text-xs text-[#F8FAFC] select-text border-t border-[rgba(148,163,184,0.14)] ${
        isTerminalExpanded ? 'h-96 max-h-[500px]' : ''
      }`}
      role="region"
      aria-label="Kubernetes Simulation Terminal"
    >
      {/* Terminal Title Bar */}
      <div className="h-9 bg-[#0E1625] px-3 flex items-center justify-between border-b border-[rgba(148,163,184,0.14)] select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-[#6EA8FE]" />
          <span className="font-bold text-[#F8FAFC]">Kubernetes Terminal</span>
          <span className="hidden md:inline text-[11px] text-[#8190A7] px-2 py-0.5 rounded bg-[#151F31] border border-[rgba(148,163,184,0.1)]">
            Safe browser simulation — no real cluster is modified
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={copyScrollback}
            className="p-1 rounded hover:bg-[#151F31] text-[#8190A7] hover:text-[#F8FAFC] transition-colors"
            title="Copy scrollback output"
            aria-label="Copy terminal output"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#4ADE80]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => actions.executeCommand('clear')}
            className="p-1 rounded hover:bg-[#151F31] text-[#8190A7] hover:text-[#F8FAFC] transition-colors"
            title="Clear terminal"
            aria-label="Clear terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={actions.toggleTerminalExpanded}
            className="p-1 rounded hover:bg-[#151F31] text-[#8190A7] hover:text-[#F8FAFC] transition-colors"
            title={isTerminalExpanded ? 'Collapse terminal' : 'Expand terminal'}
            aria-label={isTerminalExpanded ? 'Collapse terminal' : 'Expand terminal'}
          >
            {isTerminalExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Guided Command Token Breakdown Banner */}
      {activeMission?.guidedCommand && (
        <div className="bg-[#0E1625]/90 border-b border-[rgba(148,163,184,0.1)] px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="text-[10px] text-[#8190A7] font-semibold uppercase tracking-wider">Suggested:</span>
            {activeMission.guidedCommand.segments.map((seg, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-[#151F31] border border-[rgba(110,168,254,0.25)] text-[11px] text-[#6EA8FE]"
                title={seg.meaning}
              >
                {seg.token}
              </span>
            ))}
          </div>
          <button
            onClick={() => actions.insertTerminalInput(activeMission.guidedCommand!.fullCommand)}
            className="text-[11px] font-semibold text-[#5EEAD4] hover:underline whitespace-nowrap ml-2"
          >
            Insert
          </button>
        </div>
      )}

      {/* Terminal Scrollback Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 font-mono leading-relaxed">
        {terminalHistory.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center gap-2 text-[#6EA8FE]">
              <span className="text-[#8190A7]">k8s-admin@k8s-bastion:~$</span>
              <span className="font-bold text-[#F8FAFC]">{item.command}</span>
            </div>
            {item.output && (
              <pre
                className={`whitespace-pre-wrap text-xs pl-2 font-mono ${
                  item.success ? 'text-[#B8C4D6]' : 'text-[#FB7185]'
                }`}
              >
                {item.output}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Terminal Input Line & Run Button */}
      <form onSubmit={handleExecute} className="bg-[#0E1625] border-t border-[rgba(148,163,184,0.14)] px-3 py-2 flex items-center gap-2">
        <span className="text-[#6EA8FE] font-bold shrink-0">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type 'kubectl get nodes', 'kubectl run web-01 --image=nginx', or 'help'..."
          className="flex-1 bg-transparent text-sm font-mono text-[#F8FAFC] placeholder-[#8190A7] focus:outline-none"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          aria-label="Kubernetes Command Input"
        />
        <button
          type="submit"
          className="btn-primary h-8 px-3 text-xs font-bold shrink-0"
          title="Run command (Enter)"
          aria-label="Execute Command"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Run</span>
        </button>
      </form>
    </div>
  );
};

export default BastionTerminal;
