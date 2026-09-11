import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../state/useGameStore';
import { Terminal, CornerDownLeft, HelpCircle, Trash2, Maximize2, Minimize2 } from 'lucide-react';

export const BastionTerminal: React.FC = () => {
  const { terminalHistory, actions, lastCommand } = useGameStore();
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const historyCommandsRef = useRef<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lastCommand && !historyCommandsRef.current.includes(lastCommand)) {
      historyCommandsRef.current.push(lastCommand);
    }
  }, [lastCommand]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    actions.executeCommand(inputVal);
    setInputVal('');
    setHistoryIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const list = historyCommandsRef.current;
      if (list.length === 0) return;

      const nextIndex = historyIndex === null ? list.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(list[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const list = historyCommandsRef.current;
      if (list.length === 0 || historyIndex === null) return;

      const nextIndex = historyIndex + 1;
      if (nextIndex >= list.length) {
        setHistoryIndex(null);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(list[nextIndex] || '');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      actions.executeCommand('clear');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const val = inputVal.trim();
      if (val === 'kubectl get' || val === 'oc get') setInputVal('kubectl get pods');
      else if (val === 'kubectl get n' || val === 'kubectl get no' || val === 'oc get n') setInputVal('kubectl get nodes');
      else if (val === 'kubectl get p' || val === 'kubectl get po' || val === 'oc get p') setInputVal('kubectl get pods');
      else if (val === 'kubectl get pods -' || val === 'oc get pods -') setInputVal('kubectl get pods -o wide');
      else if (val === 'kubectl r' || val === 'kubectl ru' || val === 'oc r') setInputVal('kubectl run web-01 --image=nginx');
      else if (val === 'kubectl a' || val === 'kubectl ap') setInputVal('kubectl apply -f compute-01.yaml');
      else if (val === 'kubectl d' || val === 'kubectl des' || val === 'oc d') setInputVal('kubectl describe node worker-1');
    }
  };

  const formatOutput = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let lineClass = 'text-[#C6CDDB]';
      if (line.includes('NAME') && (line.includes('STATUS') || line.includes('READY'))) {
        lineClass = 'text-[#6594FF] font-semibold';
      } else if (line.includes('Ready') || line.includes('Running') || line.includes('created') || line.includes('Started')) {
        lineClass = 'text-[#54D98C]';
      } else if (line.includes('Pending') || line.includes('ContainerCreating') || line.includes('Scheduling')) {
        lineClass = 'text-[#F2B95F]';
      } else if (line.includes('error:') || line.includes('Error') || line.includes('NotReady') || line.includes('Failed')) {
        lineClass = 'text-[#F06D78] font-medium';
      } else if (line.startsWith('Hint:') || line.includes('Did you mean')) {
        lineClass = 'text-[#C6CDDB] italic';
      } else if (line.startsWith('===')) {
        lineClass = 'text-[#32D5D2] font-semibold';
      }

      return (
        <div key={idx} className={`${lineClass} font-mono leading-relaxed whitespace-pre-wrap`}>
          {line}
        </div>
      );
    });
  };

  return (
    <div
      className={`flex flex-col bg-[#050711] border-t border-[rgba(132,156,205,0.16)] backdrop-blur-xl transition-all duration-300 ${
        isExpanded ? 'h-[450px] absolute bottom-0 left-0 right-0 z-30 shadow-2xl' : 'h-full'
      }`}
    >
      {/* Terminal Titlebar & Command Action Chips */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#080B17] border-b border-[rgba(132,156,205,0.14)] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F06D78]/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2B95F]/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#54D98C]/80 inline-block"></span>
          </div>
          <div className="flex items-center gap-1.5 text-[#C6CDDB] font-mono font-medium text-[11px]">
            <Terminal size={13} className="text-[#4F7CFF]" />
            <span>bastion.k8s-training (~/cluster)</span>
          </div>
        </div>

        {/* Quick Command Suggestion Chips */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => actions.executeCommand('kubectl get nodes')}
            className="px-2.5 py-1 rounded-md bg-[#11182A] hover:bg-[#1B2640] text-[#6594FF] font-mono text-[11px] transition-all border border-[#4F7CFF]/25 hover:border-[#4F7CFF]/50 cursor-pointer active:scale-95"
            title="List worker nodes"
          >
            kubectl get nodes
          </button>
          <button
            onClick={() => actions.executeCommand('kubectl get pods -o wide')}
            className="px-2.5 py-1 rounded-md bg-[#11182A] hover:bg-[#1B2640] text-[#6594FF] font-mono text-[11px] transition-all border border-[#4F7CFF]/25 hover:border-[#4F7CFF]/50 cursor-pointer active:scale-95"
            title="List pods with assigned node"
          >
            kubectl get pods -o wide
          </button>
          <button
            onClick={() => actions.executeCommand('help')}
            className="px-2.5 py-1 rounded-md bg-[#11182A] hover:bg-[#1B2640] text-[#F2B95F] font-mono text-[11px] flex items-center gap-1 transition-all border border-[#F2B95F]/25 hover:border-[#F2B95F]/50 cursor-pointer active:scale-95"
            title="Show commands reference"
          >
            <HelpCircle size={11} />
            <span>help</span>
          </button>
          <button
            onClick={() => actions.executeCommand('clear')}
            className="px-2 py-1 rounded-md bg-[#11182A] hover:bg-[#1B2640] text-[#7F8CA3] hover:text-[#F7F9FF] font-mono text-[11px] flex items-center gap-1 transition-all border border-[rgba(132,156,205,0.16)] cursor-pointer active:scale-95"
            title="Clear terminal screen (Ctrl+L)"
          >
            <Trash2 size={11} />
            <span>clear</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md bg-[#11182A] hover:bg-[#1B2640] text-[#7F8CA3] hover:text-[#F7F9FF] transition-all border border-[rgba(132,156,205,0.16)] cursor-pointer"
            title={isExpanded ? 'Collapse terminal' : 'Expand terminal'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Terminal History Output Stream */}
      <div
        className="flex-1 p-4 overflow-y-auto font-mono text-[13px] space-y-2.5 cursor-text selection:bg-[#4F7CFF]/30 selection:text-[#F7F9FF]"
        onClick={() => inputRef.current?.focus()}
      >
        {terminalHistory.map((item) => (
          <div key={item.id} className="space-y-0.5">
            {item.command && (
              <div className="flex items-center gap-2 text-[#7F8CA3]">
                <span className="text-[#54D98C] font-semibold">[student@k8s-bastion ~]$</span>
                <span className="text-[#F7F9FF] font-medium">{item.command}</span>
                <span className="text-[10px] text-[#7F8CA3] ml-auto">{item.timestamp}</span>
              </div>
            )}
            {item.output && (
              <div className="pl-3 border-l border-[rgba(132,156,205,0.16)] my-1">
                {formatOutput(item.output)}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Command Input Prompt (Tight Tutorial Target) */}
      <form
        data-tutorial="terminal-input"
        onSubmit={handleSubmit}
        className="flex items-center px-4 py-2.5 bg-[#080B17] border-t border-[rgba(132,156,205,0.16)]"
      >
        <span className="text-[#54D98C] font-mono font-semibold mr-2.5 select-none text-[13px]">
          [student@k8s-bastion ~]$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type kubectl command... (e.g. kubectl get nodes, kubectl run web-01 --image=nginx, help)"
          className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#6594FF] placeholder:text-[#4A5B73] focus:ring-0"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          className="ml-2 px-3.5 py-1.5 bg-gradient-to-r from-[#4F7CFF] to-[#7765F8] hover:from-[#6594FF] hover:to-[#8B78FF] text-white rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 shadow-md shadow-[#4F7CFF]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>RUN</span>
          <CornerDownLeft size={12} />
        </button>
      </form>
    </div>
  );
};
