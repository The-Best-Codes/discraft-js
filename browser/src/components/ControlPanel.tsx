import {
  Activity,
  AlertCircle,
  Loader2,
  Pause,
  Play,
  Power,
  Square as Stop,
} from "lucide-react";

interface ControlPanelProps {
  isInitialized: boolean;
  processStatus:
    | "initializing"
    | "idle"
    | "installing"
    | "building"
    | "running"
    | "stopped"
    | "error";
  onStart: () => void;
  onStop: () => void;
}

export function ControlPanel({
  isInitialized,
  processStatus,
  onStart,
  onStop,
}: ControlPanelProps) {
  return (
    <div className="controls-panel flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-slate-200">Controls</h2>
        <div className="flex flex-row gap-2">
          <button
            onClick={onStart}
            disabled={
              !isInitialized ||
              processStatus === "running" ||
              processStatus === "building" ||
              processStatus === "installing" ||
              processStatus === "initializing"
            }
            className="w-full bg-green-600/90 hover:bg-green-500/90
              text-white font-medium py-2 px-4 rounded-md shadow-lg transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700/50
              flex items-center justify-center gap-2 focus:outline-none focus:ring-2
              focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            title="Start the process"
          >
            <Play className="h-4 w-4" />
            Start
          </button>

          <button
            onClick={onStop}
            disabled={processStatus !== "running"}
            className="w-full bg-red-600/90 hover:bg-red-500/90
              text-white font-medium py-2 px-4 rounded-md shadow-lg transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700/50
              flex items-center justify-center gap-2 focus:outline-none focus:ring-2
              focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            title="Stop the process"
          >
            <Stop className="h-4 w-4" />
            Stop
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-400">Status</h2>
        <div className="bg-slate-800/50 rounded-md p-3 flex items-center gap-3 border border-slate-700/50">
          {processStatus === "initializing" && (
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          )}
          {processStatus === "installing" && (
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          )}
          {processStatus === "building" && (
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          )}
          {processStatus === "running" && (
            <Activity className="h-5 w-5 text-green-400" />
          )}
          {processStatus === "stopped" && (
            <Pause className="h-5 w-5 text-slate-400" />
          )}
          {processStatus === "idle" && (
            <Power className="h-5 w-5 text-slate-400" />
          )}
          {processStatus === "error" && (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
          <div className="flex flex-col">
            <span className="font-medium">
              {processStatus === "initializing" && "Initializing..."}
              {processStatus === "installing" && "Installing..."}
              {processStatus === "building" && "Building..."}
              {processStatus === "running" && "Running"}
              {processStatus === "stopped" && "Stopped"}
              {processStatus === "idle" && "Ready"}
              {processStatus === "error" && "Error"}
            </span>
            <span className="text-sm text-slate-400">
              {processStatus === "initializing" && "Setting up environment"}
              {processStatus === "installing" && "Setting up dependencies"}
              {processStatus === "building" && "Building project"}
              {processStatus === "running" && "Process is active"}
              {processStatus === "stopped" && "Process terminated"}
              {processStatus === "idle" && "Ready to start"}
              {processStatus === "error" && "Process failed"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
