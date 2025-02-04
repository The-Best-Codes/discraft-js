import { ReactNode } from "react";
import WebContainerProvider from "react-webcontainers";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return <WebContainerProvider>{children}</WebContainerProvider>;
}
