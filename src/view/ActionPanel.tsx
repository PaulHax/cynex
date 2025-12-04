import type { AgentAction, MetricScore } from "../trajectory/types";

type ActionPanelProps = {
  step: number;
  totalSteps: number;
  blueAction?: AgentAction;
  redAction?: AgentAction;
  score?: MetricScore;
};

const ActionDisplay = ({
  action,
  agent,
}: {
  action?: AgentAction;
  agent: "blue" | "red";
}) => {
  if (!action) return null;

  const agentColor = agent === "blue" ? "text-blue-400" : "text-red-400";
  const agentLabel = agent === "blue" ? "BLUE" : "RED";
  const statusIcon = action.Status === "TRUE" ? "✓" : "✗";
  const statusColor =
    action.Status === "TRUE" ? "text-green-400" : "text-red-400";

  return (
    <div className="border-t border-slate-600 py-2">
      <div className={`font-semibold ${agentColor}`}>
        {agent === "blue" ? "🔵" : "🔴"} {agentLabel}
      </div>
      <div className="text-slate-300 text-sm mt-1">
        <span className="font-medium">{action.Action}</span>
        {action.Host && action.Host !== action.Action && (
          <span className="text-slate-400"> → {action.Host}</span>
        )}
      </div>
      <div className={`text-sm ${statusColor}`}>
        {statusIcon} {action.Status === "TRUE" ? "Success" : "Failed"}
      </div>
    </div>
  );
};

const ScoreDisplay = ({ score }: { score?: MetricScore }) => {
  if (!score) return null;

  return (
    <div className="border-t border-slate-600 py-2">
      <div className="font-semibold text-slate-300 text-sm">Metrics</div>
      <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
        <div>
          <span className="text-slate-400">C:</span>{" "}
          <span className="text-slate-200">{score.C}</span>
        </div>
        <div>
          <span className="text-slate-400">I:</span>{" "}
          <span className="text-slate-200">{score.I}</span>
        </div>
        <div>
          <span className="text-slate-400">A:</span>{" "}
          <span className="text-slate-200">{score.A}</span>
        </div>
        <div>
          <span className="text-slate-400">R:</span>{" "}
          <span className="text-slate-200">{score.Resilience.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export const ActionPanel = ({
  step,
  totalSteps,
  blueAction,
  redAction,
  score,
}: ActionPanelProps) => (
  <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 w-64">
    <div className="text-lg font-bold text-slate-100 pb-2">
      Step {step + 1} / {totalSteps}
    </div>
    <ActionDisplay action={blueAction} agent="blue" />
    <ActionDisplay action={redAction} agent="red" />
    <ScoreDisplay score={score} />
  </div>
);
