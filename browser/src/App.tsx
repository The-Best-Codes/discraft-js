import { useEffect, useRef, useState } from "react";
import { useWebContainer } from "react-webcontainers";
import { useXTerm } from "react-xtermjs";
import { initialFiles } from "./files";
import { ProcessStatus } from "./types";

// JSH Shell Process Type
type ShellProcess = {
  input: WritableStreamDefaultWriter<string>;
  resize: (dimensions: { cols: number; rows: number }) => void;
  exit: Promise<number>;
};

import { ControlPanel } from "./components/ControlPanel";
import { MonitoringPanel } from "./components/MonitoringPanel";
import { Terminal } from "./components/Terminal";

export default function App() {
  const webcontainer = useWebContainer();
  const { instance: terminal, ref: terminalRef } = useXTerm();
  const inputWriter = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const [processStatus, setProcessStatus] =
    useState<ProcessStatus>("initializing");
  const [isInitialized, setIsInitialized] = useState(false);

  const shellProcess = useRef<ShellProcess | null>(null);
  const [process, setProcess] = useState<{
    start: () => Promise<void>;
    stop: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    async function initialize() {
      if (!terminal || !webcontainer) return;

      setProcessStatus("setting-up");

      // Start JSH shell
      try {
        if (!webcontainer) throw new Error("WebContainer not initialized");
        
        const jshProcess = await webcontainer.spawn('jsh', {
          terminal: {
            cols: terminal?.cols || 80,
            rows: terminal?.rows || 24
          }
        });

        // Set up shell output handling
        jshProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal?.write(data);
            }
          })
        );

        // Store shell process for input handling
        shellProcess.current = {
          input: jshProcess.input.getWriter(),
          resize: (dimensions) => jshProcess.resize(dimensions),
          exit: jshProcess.exit
        };

        // Set up input handling
        terminal?.onData((data) => {
          shellProcess.current?.input.write(data).catch((err: Error) => {
            console.error("Error writing to JSH process:", err);
          });
        });

        setProcessStatus("installing");
      } catch (error) {
        console.error("Error initializing JSH:", error);
        setProcessStatus("error");
        return;
      }

      try {
        // Write files
        for (const [path, { file }] of Object.entries(initialFiles)) {
          await webcontainer.fs.writeFile(path, file.contents);
          console.log(`Successfully wrote ${path}`);
        }
        console.log("All initial files written successfully.");
      } catch (error) {
        console.error("Error during initialization:", error);
        setProcessStatus("error");
        return;
      }

      // Check for node_modules and install if needed
      try {
        if (!webcontainer) throw new Error("WebContainer not initialized");
        await webcontainer.fs.readdir("node_modules");
        console.log("node_modules already exists.");
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === "WebContainer not initialized"
        )
          throw error;

        // Any other error means node_modules doesn't exist
        console.log("node_modules does not exist, installing...");
        if (!webcontainer) throw new Error("WebContainer not initialized");
        const installProcess = await webcontainer.spawn("npm", ["install"]);

        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal?.write(data);
            },
          }),
        );

        if ((await installProcess.exit) !== 0) {
          console.error("npm install exited with a non-zero code.");
        }

        await installProcess.exit;
        console.log("npm install finished.");
      } finally {
        // Installation complete
      }

      // Create start and stop process functions
      const startProcess = async () => {
        try {
          if (!webcontainer) throw new Error("WebContainer not initialized");

          setProcessStatus("running");
          console.log("Starting process...");

          // We don't need to start a new process since JSH is already running
          // Just send the npm start command to the JSH shell
          shellProcess.current?.input.write("npm start\n");

          // Monitor process exit
          if (!shellProcess.current) {
            throw new Error("Shell process not initialized");
          }
          const exitCode = await shellProcess.current.exit;
          console.log("Process finished with code:", exitCode);
          setProcessStatus(
            exitCode === 0 || exitCode === 130 ? "stopped" : "error",
          );
        } catch (error) {
          console.error("Error starting process:", error);
          setProcessStatus("error");
          throw error;
        }
      };

      const stopProcess = async () => {
        try {
          if (!webcontainer) throw new Error("WebContainer not initialized");

          setProcessStatus("stopped");
          console.log("Stopping process...");

          if (shellProcess.current) {
            // Send Ctrl+C (ASCII code 3)
            await shellProcess.current.input.write("\x03");
          }

          console.log("Process stopped successfully");
        } catch (error) {
          console.error("Error stopping process:", error);
          setProcessStatus("error");
          throw error;
        }
      };

      setProcess({ start: startProcess, stop: stopProcess });
      setProcessStatus("idle"); // Set to idle after initial setup is done
      setIsInitialized(true); // Mark as initialized
      console.log("Initialization complete.");
    }

    initialize();

    // Set up cleanup
    return () => {
      shellProcess.current?.input.close().catch(console.error);
      inputWriter.current?.close().catch(console.error);
    };
  }, [terminal, webcontainer]);

  const handleStart = async () => {
    if (
      process &&
      processStatus !== "running" &&
      processStatus !== "installing"
    ) {
      await process.start();
    }
  };

  const handleStop = async () => {
    if (process && processStatus === "running") {
      await process.stop();
    }
  };

  return (
    <div className="h-screen bg-slate-900 text-slate-300 p-6">
      <div className="h-full flex gap-6">
        {/* Left panel - Controls */}
        <div className="w-1/3 flex flex-col gap-4 min-w-[300px]">
          <ControlPanel
            isInitialized={isInitialized}
            processStatus={processStatus === "setting-up" ? "installing" : processStatus}
            onStart={handleStart}
            onStop={handleStop}
          />
          <MonitoringPanel processStatus={processStatus} />
        </div>

        {/* Right panel - Terminal */}
        <div className="flex-1">
          <Terminal terminalRef={terminalRef} terminal={terminal} />
        </div>
      </div>
    </div>
  );
}
