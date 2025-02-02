import { WebContainer } from "@webcontainer/api";
import Ansi from "ansi-to-html";
import { useEffect, useRef, useState } from "react";

const ansiConverter = new Ansi();

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
  const [output, setOutput] = useState<string>("");
  const terminalRef = useRef<HTMLDivElement>(null);
  const [iframeURL, setIframeURL] = useState<string | null>(null);
  const [isBooted, setIsBooted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const initializeWebContainer = async () => {
      if (isBooted) return;
      try {
        const webcontainer = await WebContainer.boot();
        setWebcontainerInstance(webcontainer);
        setIsBooted(true);
        await webcontainer.mount(files);

        // Install dependencies
        const installProcess = await webcontainer.spawn("npm", ["install"]);
        installProcess.output.pipeTo(
          new WritableStream({
            write(chunk) {
              const htmlChunk = ansiConverter.toHtml(chunk);
              setOutput((prevOutput) => prevOutput + htmlChunk);
            },
          }),
        );
        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error("Installation failed");
        }

        // Start the dev server
        const startProcess = await webcontainer.spawn("npm", ["run", "start"]);
        startProcess.output.pipeTo(
          new WritableStream({
            write(chunk) {
              const htmlChunk = ansiConverter.toHtml(chunk);
              setOutput((prevOutput) => prevOutput + htmlChunk);
            },
          }),
        );

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
        webcontainerInstance.teardown(); // Keep teardown
      }
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">WebContainer Example</h1>
      <p className="text-gray-400 mb-4">
        Running an Express server in WebContainer:
      </p>
      <div className="w-full max-w-4xl flex flex-col">
        <div
          className="bg-gray-800 border border-gray-700 rounded-md p-4 overflow-y-auto w-full h-96 font-mono mb-4" // Adjusted width, added mb-4 for margin
          ref={terminalRef}
          dangerouslySetInnerHTML={{ __html: output }}
        ></div>

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
