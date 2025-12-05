import { useEffect, useRef } from "react";
import type { AgentAction } from "../trajectory/types";

type ActionHistoryProps = {
  blueActions: AgentAction[];
  redActions: AgentAction[];
  currentStep: number;
  onStepChange: (step: number) => void;
};

const ActionCell = ({ action }: { action: AgentAction }) => (
  <div className="flex-1 min-w-0">
    <div className="text-slate-200 font-medium truncate text-xs">
      {action.Action}
    </div>
    {action.Host && action.Host !== action.Action && (
      <div className="text-slate-300 text-xs truncate">{action.Host}</div>
    )}
  </div>
);

export const ActionHistory = ({
  blueActions,
  redActions,
  currentStep,
  onStepChange,
}: ActionHistoryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [currentStep]);

  const allSteps = Array.from({ length: blueActions.length }, (_, i) => i);

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="flex gap-2 mb-2 text-sm font-semibold">
        <div className="flex-1 text-blue-400">🔵 BLUE</div>
        <div className="flex-1 text-red-400">🔴 RED</div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 action-history-scroll"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 transparent" }}
      >
        {allSteps.map((step) => (
          <div
            key={step}
            ref={step === currentStep ? currentRowRef : undefined}
            onClick={() => onStepChange(step)}
            className={`flex gap-2 py-1.5 px-2 rounded text-xs cursor-pointer ${
              step === currentStep
                ? "bg-slate-600/80 border-l-2 border-slate-400"
                : "opacity-70 hover:opacity-100 hover:bg-slate-700/50"
            }`}
          >
            <div className="text-slate-500 w-5 shrink-0">{step + 1}</div>
            <ActionCell action={blueActions[step]} />
            <ActionCell action={redActions[step]} />
          </div>
        ))}
      </div>
    </div>
  );
};
