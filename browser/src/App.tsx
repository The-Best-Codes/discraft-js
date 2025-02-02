import { WebContainer } from "@webcontainer/api";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef, useState } from "react";
import "xterm/css/xterm.css";
import "./Terminal.css";

const files = {
  "index.js": {
    file: {
      contents: `
import express from 'express';
const app = express();
const port = 3111;

app.get('/', (req, res) => {
    res.send('Welcome to a WebContainers app! 🥳');
});

app.listen(port, () => {
    console.log(\`App is live at http://localhost:\${port}\`);
});`,
    },
  },
  "package.json": {
    file: {
      contents: `
        {
          "name": "example-app",
          "type": "module",
          "dependencies": {
            "express": "latest",
            "nodemon": "latest"
          },
          "scripts": {
            "start": "nodemon index.js"
          }
        }`,
    },
  },
};

export default function App() {
  const [webcontainerInstance, setWebcontainerInstance] =
    useState<WebContainer | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [iframeURL, setIframeURL] = useState<string | null>(null);
  const [isBooted, setIsBooted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const startProcessRef = useRef<any | null>(null);

  useEffect(() => {
    const initializeWebContainer = async () => {
      if (isBooted) return;

      // Initialize xterm
      if (terminalRef.current) {
        const term = new Terminal({
          convertEol: true,
          cursorBlink: true,
          theme: {
            background: "#1e1e1e",
            foreground: "#d4d4d4",
            cursor: "#d4d4d4",
          },
        });
        fitAddon.current = new FitAddon();
        term.loadAddon(fitAddon.current);
        term.open(terminalRef.current);
        fitAddon.current.fit();
        terminal.current = term;

        window.addEventListener("resize", () => {
          fitAddon.current?.fit();
        });
      }
      try {
        const webcontainer = await WebContainer.boot();
        setWebcontainerInstance(webcontainer);
        setIsBooted(true);
        await webcontainer.mount(files);

        //Install dependancies
        const installProcess = await webcontainer.spawn("npm", ["install"]);
        installProcess.output.pipeTo(
          new WritableStream({
            write(chunk) {
              terminal.current?.write(chunk);
            },
          }),
        );
        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error("Installation failed");
        }
        // Start the dev server
        const startProcess = await webcontainer.spawn("npm", ["run", "start"]);
        startProcessRef.current = startProcess;

        startProcess.output.pipeTo(
          new WritableStream({
            write(chunk) {
              terminal.current?.write(chunk);
            },
          }),
        );
        // Handle user input
        terminal.current?.onData((data) => {
          const encoder = new TextEncoder();
          const encoded = encoder.encode(data);
          startProcessRef.current.input.write(encoded);
        });

        webcontainer.on("server-ready", (port, url) => {
          console.log(`Server ready at ${url}`);
          setIframeURL(url);
        });
      } catch (error) {
        console.error("Failed to initialize WebContainer:", error);
      }
    };

    initializeWebContainer();

    return () => {
      if (webcontainerInstance) {
        webcontainerInstance.teardown();
      }
      if (terminal.current) {
        terminal.current.dispose();
      }
      window.removeEventListener("resize", () => {
        fitAddon.current?.fit();
      });
    };
  }, []);

  useEffect(() => {
    if (terminal.current) {
      fitAddon.current?.fit();
    }
  }, [terminal, isBooted]);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">WebContainer Example</h1>
      <p className="text-gray-400 mb-4">
        Running an Express server in WebContainer:
      </p>
      <div className="w-full max-w-4xl flex flex-col">
        <div className="terminal-container  mb-4" ref={terminalRef}></div>

        <div className="w-full h-96 bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
          {iframeURL ? (
            <iframe
              ref={iframeRef}
              src={iframeURL}
              className="w-full h-full"
              title="WebContainer Preview"
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">Loading preview...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
