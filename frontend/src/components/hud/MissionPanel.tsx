import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  BookOpen,
  Target,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const MissionPanel: React.FC = () => {
  const {
    activeMission,
    activeMissionStatus,
    actions,
  } = useGameStore();

  if (!activeMission) {
    return (
      <div className="p-5 text-center text-[#8190A7] text-sm">
        No active mission selected. Choose a lesson from the chapter map.
      </div>
    );
  }

  const isCompleted = activeMissionStatus === 'COMPLETED';
  const isFailed = activeMissionStatus === 'FAILED_RETRYABLE';

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 text-[#F8FAFC]">
      {/* Mission Header */}
      <div className="border-b border-[rgba(148,163,184,0.14)] pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono font-bold text-[#6EA8FE] uppercase tracking-wider">
            Lesson {activeMission.lessonNumber} • {activeMission.subtitle}
          </span>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#151F31] text-[#FBBF24]">
            +{activeMission.basePoints} pts
          </span>
        </div>
        <h2 className="text-base font-bold text-[#F8FAFC] leading-snug">
          {activeMission.title}
        </h2>
      </div>

      {/* 1. LEARN: Concept Overview */}
      <div className="bg-[#151F31] rounded-xl p-3.5 border border-[rgba(148,163,184,0.14)] space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#6EA8FE] uppercase tracking-wide">
          <BookOpen className="w-3.5 h-3.5" />
          <span>1. Learn</span>
        </div>
        <p className="text-xs leading-relaxed text-[#B8C4D6]">
          {activeMission.teach.summary}
        </p>

        {/* Concept definitions */}
        {activeMission.teach.concepts.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {activeMission.teach.concepts.map((c, idx) => (
              <div key={idx} className="bg-[#0E1625] p-2 rounded-lg text-xs space-y-0.5 border border-[rgba(148,163,184,0.08)]">
                <span className="font-mono font-semibold text-[#5EEAD4]">{c.term}: </span>
                <span className="text-[#B8C4D6]">{c.plainMeaning}</span>
                {c.analogy && (
                  <p className="text-[11px] text-[#8190A7] italic">Analogy: {c.analogy}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. GOAL: Plain Language Objective */}
      <div className="bg-[#151F31] rounded-xl p-3.5 border border-[rgba(148,163,184,0.14)] space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#5EEAD4] uppercase tracking-wide">
          <Target className="w-3.5 h-3.5" />
          <span>2. Goal</span>
        </div>
        <p className="text-xs font-medium leading-relaxed text-[#F8FAFC]">
          {activeMission.goal.plainLanguage}
        </p>

        {/* 3. YOU WILL USE: Explicit Values */}
        {activeMission.goal.requiredInputs.length > 0 && (
          <div className="pt-1.5 border-t border-[rgba(148,163,184,0.1)] space-y-1.5">
            <span className="text-[11px] font-semibold text-[#8190A7] uppercase tracking-wider block">
              You Will Use:
            </span>
            {activeMission.goal.requiredInputs.map((input, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs bg-[#0E1625] px-2.5 py-1.5 rounded-lg border border-[rgba(148,163,184,0.08)]">
                <div>
                  <span className="text-[#8190A7]">{input.label}: </span>
                  <span className="font-mono font-semibold text-[#6EA8FE]">{input.value}</span>
                </div>
                <span className="text-[10px] text-[#8190A7] ml-2 text-right">{input.explanation}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. BUILD THE COMMAND: Token Breakdown */}
      {activeMission.guidedCommand && (
        <div className="bg-[#151F31] rounded-xl p-3.5 border border-[rgba(148,163,184,0.14)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FBBF24] uppercase tracking-wide">
              <Terminal className="w-3.5 h-3.5" />
              <span>3. Command Breakdown</span>
            </div>
            <button
              onClick={() => actions.insertTerminalInput(activeMission.guidedCommand!.fullCommand)}
              className="text-[11px] font-semibold text-[#6EA8FE] hover:text-[#F8FAFC] underline flex items-center gap-1"
            >
              Insert Command
            </button>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {activeMission.guidedCommand.segments.map((seg, idx) => (
              <div key={idx} className="bg-[#0E1625] px-2 py-1 rounded-md border border-[rgba(148,163,184,0.1)] text-xs font-mono">
                <span className="font-bold text-[#F8FAFC]">{seg.token}</span>
                <span className="text-[10px] text-[#8190A7] block">{seg.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. RUN & ACTION BUTTON */}
      {!isCompleted && !isFailed && (
        <div className="space-y-2 pt-1">
          {activeMission.guidedCommand && (
            <button
              onClick={() => actions.insertTerminalInput(activeMission.guidedCommand!.fullCommand)}
              className="w-full btn-primary text-xs h-10 font-semibold"
            >
              <Terminal className="w-4 h-4" />
              Insert &quot;{activeMission.guidedCommand.fullCommand}&quot;
            </button>
          )}

          {/* Interaction completion button for Lesson 0 & 2 */}
          {(activeMission.completionRule.type === 'inspect-cluster-components' ||
            activeMission.completionRule.type === 'concept-review') && (
            <button
              onClick={() => actions.evaluateActiveObjective('INTERACTION')}
              className="w-full btn-primary text-xs h-10 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              Acknowledge & Complete Lesson
            </button>
          )}

          <div className="flex items-center justify-between text-xs text-[#8190A7] px-1">
            <span>Need syntax help?</span>
            <button
              onClick={actions.openHintModal}
              className="text-[#FBBF24] hover:underline flex items-center gap-1 font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Open Hints
            </button>
          </div>
        </div>
      )}

      {/* 6. REVIEW: After Mission Complete */}
      {isCompleted && (
        <div className="bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4ADE80] uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4" />
            <span>Mission Complete!</span>
          </div>

          <div className="space-y-1.5 text-xs text-[#B8C4D6]">
            {activeMission.review.whatHappened.map((item, idx) => (
              <p key={idx}>• {item}</p>
            ))}
          </div>

          <div className="bg-[#0E1625] p-2.5 rounded-lg text-xs border border-[#4ADE80]/20">
            <span className="font-semibold text-[#4ADE80]">Key Takeaway: </span>
            <span className="text-[#F8FAFC]">{activeMission.review.keyTakeaway}</span>
          </div>

          <button
            onClick={actions.advanceToNextMission}
            className="w-full btn-primary text-xs h-10 font-bold bg-gradient-to-r from-[#4ADE80] to-[#5EEAD4] text-[#070B14]"
          >
            Next Lesson <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 7. FAILED RETRYABLE: Challenge mode retry */}
      {isFailed && (
        <div className="bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FB7185] uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4" />
            <span>Time to Impact Expired</span>
          </div>
          <p className="text-xs text-[#B8C4D6]">
            The workload was not running and ready in time. In Challenge Mode, speed matters!
          </p>
          <button
            onClick={actions.retryMission}
            className="w-full btn-secondary text-xs h-10 font-bold text-[#FB7185] border-[#FB7185]/40 hover:bg-[#FB7185]/10"
          >
            <RotateCcw className="w-4 h-4" /> Retry Mission
          </button>
        </div>
      )}
    </div>
  );
};

export default MissionPanel;
