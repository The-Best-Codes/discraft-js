import { Cpu, Timer } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [currentMemory, setCurrentMemory] = useState<number>(0);

  // Update start time when process starts running
  useEffect(() => {
    if (processStatus === "running") {
      setStartTime(new Date());
    } else if (processStatus === "stopped" || processStatus === "error") {
      setStartTime(null);
      setMemoryUsage([]);
    }
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

    const interval = setInterval(async () => {
      try {
        // Try to get memory usage through available APIs
        let memoryInMB = 0;

        // Try performance API first
        if ("measureUserAgentSpecificMemory" in performance) {
          const memory = await (
            performance as any
          ).measureUserAgentSpecificMemory();
          memoryInMB = Math.round(memory.bytes / 1024 / 1024);
        }
        // Fallback to navigator.memory if available
        else if (navigator && "memory" in navigator) {
          const memory = (navigator as any).memory;
          memoryInMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        }
        setCurrentMemory(memoryInMB);

        // Only collect data points when running
        if (processStatus === "running") {
          const now = new Date();
          const newDataPoint = {
            time: now.getTime(), // Use timestamp
            memory: memoryInMB,
          };
          console.log("New Data Point:", newDataPoint); // Debug log

          setMemoryUsage((prev) => {
            const newData = [...prev, newDataPoint];
            const oneHourAgo = new Date(now.getTime() - 3600000);
            return newData.filter((point) => new Date(point.time) > oneHourAgo);
          });
        }
      } catch (error) {
        console.error("Error monitoring memory usage:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [processStatus]);

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
          <Cpu className="h-5 w-5 text-emerald-400" />
          <div className="flex flex-col">
            <span className="font-medium">Memory Usage</span>
            <span className="text-sm text-slate-400">{currentMemory} MB</span>
          </div>
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={memoryUsage}>
           <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
              type="number"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis tick={{ fontSize: 12 }} domain={[0, "auto"]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="memory"
              stroke="#60a5fa"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
