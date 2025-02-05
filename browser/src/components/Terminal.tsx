import { FitAddon } from "@xterm/addon-fit";
import type { Terminal as ITerminal } from "@xterm/xterm";
import React, { useEffect, useRef } from "react";

interface TerminalProps {
  terminalRef: React.RefObject<HTMLDivElement>;
  terminal: ITerminal | null;
  onResize?: () => void;
}

export function Terminal({ terminalRef, terminal, onResize }: TerminalProps) {
  const fitAddon = useRef<FitAddon>(new FitAddon());
  const resizeHandler = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!terminal) return;

    // Initialize terminal
    terminal.loadAddon(fitAddon.current);
    terminal.options.theme = {
      foreground: "#eff0eb",
      background: "#1a1b26",
      green: "#9ece6a",
      cyan: "#7dcfff",
    };
    terminal.options.convertEol = true;
    terminal.options.disableStdin = true;
    terminal.options.fontSize = 14;
    terminal.options.fontFamily = 'Menlo, Monaco, "Courier New", monospace';
    terminal.options.cursorBlink = true;

    // Handle terminal resize
    resizeHandler.current = () => {
      fitAddon.current.fit();
      onResize?.();
    };
    window.addEventListener("resize", resizeHandler.current);
    resizeHandler.current();

    return () => {
      if (resizeHandler.current) {
        window.removeEventListener("resize", resizeHandler.current);
      }
    };
  }, [terminal, onResize]);

  return (
    <div
      ref={terminalRef}
      className="terminal-container h-full w-full overflow-hidden relative"
      style={{ minHeight: "400px" }}
    />
  );
}
