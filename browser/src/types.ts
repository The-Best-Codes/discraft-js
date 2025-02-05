export type ProcessStatus =
  | "initializing" // WebContainer boot
  | "setting-up"   // Loading JSH
  | "installing"   // npm install
  | "idle"
  | "running"
  | "stopped"
  | "error";
