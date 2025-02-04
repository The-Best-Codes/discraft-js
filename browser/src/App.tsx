import { FitAddon } from "@xterm/addon-fit";
import { Loader2, Play, StopCircle as Stop } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useWebContainer } from "react-webcontainers";
import { useXTerm } from "react-xtermjs";
import { initialFiles } from "./files";

// Define Process Status Types
type ProcessStatus = "idle" | "installing" | "running" | "stopped" | "error";

export default function App() {
  const webcontainer = useWebContainer();
  const { instance: terminal, ref: terminalRef } = useXTerm();
  const inputWriter = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const fitAddon = useRef<FitAddon>(new FitAddon());
  const resizeHandler = useRef<(() => void) | null>(null);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>("idle"); // State for process status
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isRunning, setIsRunning] = useState(false); // Track if index.js is running
  const [installProgress, setInstallProgress] = useState<number | null>(null); // Progress for npm install
  const [isInitialized, setIsInitialized] = useState(false); // Track if everything is initialized

  const [process, setProcess] = useState<{
    start: () => Promise<void>;
    stop: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    async function initialize() {
      if (!terminal || !webcontainer) return;

      setProcessStatus("installing");

      // Initialize terminal
      terminal.loadAddon(fitAddon.current);
      terminal.options.theme = {
        foreground: "#eff0eb",
        background: "#1a1b26",
        green: "#9ece6a",
        cyan: "#7dcfff",
      };
      terminal.options.fontSize = 14;
      terminal.options.fontFamily = 'Menlo, Monaco, "Courier New", monospace';
      terminal.options.cursorBlink = true;

      // Handle terminal resize
      resizeHandler.current = () => fitAddon.current.fit();
      window.addEventListener("resize", resizeHandler.current);
      resizeHandler.current();

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
        setInstallProgress(0);
        if (!webcontainer) throw new Error("WebContainer not initialized");
        const installProcess = await webcontainer.spawn("npm", ["install"]);

        // Function to update install progress from stdout
        const updateInstallProgress = (data: string) => {
          const match = data.match(/(\d+)%/);
          if (match && match[1]) {
            setInstallProgress(parseInt(match[1], 10));
          }
        };

        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal?.write(data); // Still write install output to terminal
              updateInstallProgress(data); // Try to parse progress
            },
          }),
        );

        await installProcess.exit;
        setInstallProgress(100); // Set to 100% when install finishes
        console.log("npm install finished.");
      } finally {
        setInstallProgress(null); // Hide progress bar after install (or if not needed)
      }

      // Create start and stop process functions
      const startProcess = async () => {
        try {
          if (!webcontainer) throw new Error("WebContainer not initialized");

          setProcessStatus("running");
          setIsRunning(true);
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

          // Set up input handling
          terminal?.onData((data: string) => {
            inputWriter.current?.write(data).catch((err: Error) => {
              console.error("Error writing to process:", err);
            });
          });

          // Monitor process exit
          const exitCode = await shellProcess.exit;
          console.log("Process finished with code:", exitCode);
          setIsRunning(false);
          setProcessStatus(exitCode === 0 ? "stopped" : "error");
        } catch (error) {
          console.error("Error starting process:", error);
          setIsRunning(false);
          setProcessStatus("error");
          throw error;
        }
      };

      const stopProcess = async () => {
        try {
          if (!webcontainer) throw new Error("WebContainer not initialized");

          setProcessStatus("stopped");
          setIsRunning(false);
          console.log("Stopping process...");

          if (inputWriter.current) {
            // Send Ctrl+C (ASCII code 3)
            await inputWriter.current.write("\x03");
            // Send 'exit' command to close the shell
            await inputWriter.current.write("exit\n");
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
      if (resizeHandler.current) {
        window.removeEventListener("resize", resizeHandler.current);
      }
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
    <div className="h-screen bg-gray-900 text-green-400 p-4 flex flex-col">
      {installProgress !== null && (
        <div className="mb-2 bg-gray-800 rounded-md overflow-hidden">
          <div
            className="bg-green-500 h-2"
            style={{ width: `${installProgress}%` }}
          ></div>
          <div className="px-2 py-1 text-sm text-gray-300 text-center">
            {installProgress < 100
              ? `Installing dependencies... ${installProgress}%`
              : "Finalizing installation..."}
          </div>
        </div>
      )}

      <div className="flex justify-start items-center mb-2">
        <button
          onClick={handleStart}
          disabled={
            !isInitialized ||
            processStatus === "running" ||
            processStatus === "installing"
          }
          className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center`}
          aria-label="Start"
        >
          <Play className="mr-2 h-4 w-4" />
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={processStatus !== "running"}
          className={`ml-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center`}
          aria-label="Stop"
        >
          <Stop className="mr-2 h-4 w-4" />
          Stop
        </button>
        {processStatus === "installing" && (
          <div className="ml-4 flex items-center text-gray-400">
            <Loader2 className="animate-spin mr-2 h-4 w-4" /> Installing...
          </div>
        )}
        {processStatus === "running" && (
          <div className="ml-4 text-green-400">Running</div>
        )}
        {processStatus === "stopped" && (
          <div className="ml-4 text-red-400">Stopped</div>
        )}
        {processStatus === "idle" && (
          <div className="ml-4 text-gray-400">Idle</div>
        )}
        {processStatus === "error" && (
          <div className="ml-4 text-red-500">Error</div>
        )}
      </div>

      <div
        ref={terminalRef}
        className="h-full bg-gray-800 rounded-md"
        style={{ height: "100%", width: "100%" }}
      ></div>
    </div>
  );
}
