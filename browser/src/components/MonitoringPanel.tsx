import { BarChart2, Cpu, Loader2, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useWebContainer } from "react-webcontainers";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ProcessStatus =
  | "initializing"
  | "idle"
  | "installing"
  | "running"
  | "stopped"
  | "error";

interface MonitoringPanelProps {
  processStatus: ProcessStatus;
}

interface MemoryDataPoint {
  time: number;
  memory: number;
}

export function MonitoringPanel({ processStatus }: MonitoringPanelProps) {
  const webcontainer = useWebContainer();
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<MemoryDataPoint[]>([]);
  const [currentMemory, setCurrentMemory] = useState<number | undefined>(
    undefined,
  );
  const [isMeasuring, setIsMeasuring] = useState(false);
  const prevStatusRef = useRef<ProcessStatus>("idle");
  const measureAbortController = useRef<AbortController | null>(null);

  // Update start time when process starts running
  useEffect(() => {
    if (processStatus === "running" && prevStatusRef.current !== "running") {
      setStartTime(new Date());
      // Only clear data when transitioning from stopped to running
      if (
        prevStatusRef.current === "stopped" ||
        prevStatusRef.current === "error"
      ) {
        setMemoryUsage([]);
        setCurrentMemory(undefined);

        // Cancel any ongoing measurements
        if (measureAbortController.current) {
          measureAbortController.current.abort();
          measureAbortController.current = null;
        }
      }
    } else if (processStatus === "stopped" || processStatus === "error") {
      setStartTime(null);
      setIsMeasuring(false); // Reset measuring state when stopped/error

      // Cancel any ongoing measurements on stop/error
      if (measureAbortController.current) {
        measureAbortController.current.abort();
        measureAbortController.current = null;
      }
    }
    prevStatusRef.current = processStatus;
  }, [processStatus]);

  // Calculate running time
  const [runningTime, setRunningTime] = useState("");
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setRunningTime(parts.join(" "));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Monitor memory usage
  useEffect(() => {
    if (!webcontainer) return;

    // Clear previous abort controller
    if (measureAbortController.current) {
      measureAbortController.current.abort();
      measureAbortController.current = null;
    }

    if (processStatus !== "running") return;

    const measureMemory = async (signal: AbortSignal) => {
      if (signal.aborted) return;

      setIsMeasuring(true);
      try {
        if ("measureUserAgentSpecificMemory" in performance) {
          const memory = await (
            performance as any
          ).measureUserAgentSpecificMemory();
          if (signal.aborted) return;

          const memoryInMB = +(memory.bytes / 1024 / 1024).toFixed(1);
          setCurrentMemory(memoryInMB);

          const now = new Date();
          const newDataPoint = {
            time: now.getTime(),
            memory: memoryInMB,
          };

          setMemoryUsage((prev) => {
            const newData = [...prev, newDataPoint];
            const oneHourAgo = new Date(now.getTime() - 3600000);
            return newData.filter((point) => new Date(point.time) > oneHourAgo);
          });
        } else {
          setCurrentMemory(undefined);
        }
      } catch (error) {
        console.error("Error monitoring memory usage:", error);
        setCurrentMemory(undefined);
      }
      if (!signal.aborted) {
        setIsMeasuring(false);
      }
    };

    // Create new abort controller for this measurement session
    measureAbortController.current = new AbortController();

    // Measure immediately when starting
    measureMemory(measureAbortController.current.signal);

    const interval = setInterval(() => {
      if (measureAbortController.current) {
        measureMemory(measureAbortController.current.signal);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (measureAbortController.current) {
        measureAbortController.current.abort();
        measureAbortController.current = null;
      }
    };
  }, [processStatus, webcontainer]);

  return (
    <div className="controls-panel flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-slate-200">Monitoring</h2>

        <div className="bg-slate-800/50 rounded-md p-3 flex items-center gap-3 border border-slate-700/50">
          <Timer className="h-5 w-5 text-blue-400" />
          <div className="flex flex-col">
            <span className="font-medium">Running Time</span>
            <span className="text-sm text-slate-400">
              {runningTime || "Not running"}
            </span>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-md p-3 flex items-center gap-3 border border-slate-700/50">
          {isMeasuring ? (
            <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
          ) : (
            <Cpu className="h-5 w-5 text-emerald-400" />
          )}
          <div className="flex flex-col">
            <span className="font-medium">Memory Usage</span>
            <span
              className={`text-sm text-slate-400 ${isMeasuring ? "animate-pulse" : ""}`}
            >
              {processStatus === "running"
                ? isMeasuring
                  ? "Measuring..."
                  : currentMemory === undefined
                    ? "Measuring..."
                    : `${currentMemory} MB`
                : "Not running"}
            </span>
          </div>
        </div>
      </div>

      <div className="h-40 relative">
        {memoryUsage.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/50 rounded-md border border-slate-700/50">
            <BarChart2 className="h-8 w-8 text-slate-600 mb-2" />
            <span className="text-slate-400 text-sm">
              No data collected yet
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={memoryUsage}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(time) => {
                  const date = new Date(time);
                  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, "auto"]}
                tickFormatter={(value) => `${value}MB`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(51, 65, 85, 0.5)",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#e2e8f0" }}
                formatter={(value: number) => [`${value} MB`, "Memory"]}
                labelFormatter={(time) => {
                  const date = new Date(time);
                  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
                }}
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="#60a5fa"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
