import { useEffect, useRef, useState } from "react";
import { useWebContainer } from "react-webcontainers";
import { useXTerm } from "react-xtermjs";
import { initialFiles } from "./files";

// Define Process Status Types
type ProcessStatus =
  | "initializing"
  | "idle"
  | "installing"
  | "running"
  | "stopped"
  | "error";

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

  const [process, setProcess] = useState<{
    start: () => Promise<void>;
    stop: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    async function initialize() {
      if (!terminal || !webcontainer) return;

      setProcessStatus("installing");

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

          // Clean up any existing input writer
          if (inputWriter.current) {
            await inputWriter.current.close();
            inputWriter.current = null;
          }

          // Start npm directly
          const shellProcess = await webcontainer.spawn("npm", ["start"]);
          inputWriter.current = shellProcess.input.getWriter();

          // Set up shell output handling
          shellProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                terminal?.write(data);
              },
              close() {
                console.log("Process output stream closed");
              },
              abort(reason: Error) {
                console.error("Process output stream aborted:", reason);
              },
            }),
          );

          // Monitor process exit
          const exitCode = await shellProcess.exit;
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

          if (inputWriter.current) {
            // Send Ctrl+C (ASCII code 3)
            await inputWriter.current.write("\x03");
            // Send 'exit' command to close the shell
            await inputWriter.current.close();
            inputWriter.current = null;
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
      inputWriter.current?.close();
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
    <div className="h-screen bg-slate-900 text-slate-300 p-3 sm:p-6">
      <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Controls panel - Full width on mobile, left panel on desktop */}
        <div className="lg:w-1/3 flex flex-col gap-4 max-h-[50vh] lg:max-h-full overflow-auto">
          <ControlPanel
            isInitialized={isInitialized}
            processStatus={processStatus}
            onStart={handleStart}
            onStop={handleStop}
          />
          <MonitoringPanel processStatus={processStatus} />
        </div>

        {/* Terminal panel - Full width on mobile, right panel on desktop */}
        <div className="lg:w-2/3 h-[45vh] lg:h-full">
          <Terminal terminalRef={terminalRef} terminal={terminal} />
        </div>
      </div>
    </div>
  );
}
