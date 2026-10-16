import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { siteUrl } from "@/lib/shared";

const inter = Inter({
  subsets: ["latin"],
});

// kept out of `global.css` so Lightning CSS doesn't warn about `::highlight()`
const searchHighlightCss = `::highlight(fd-search) {
  color: var(--color-fd-primary);
  text-decoration-line: underline;
}`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <style href="fd-search-highlight" precedence="default">
          {searchHighlightCss}
        </style>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
