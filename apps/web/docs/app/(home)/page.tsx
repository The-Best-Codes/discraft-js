import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center bg-white dark:bg-black">
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-fd-foreground md:text-5xl lg:text-6xl">
        Discraft Docs
      </h1>
      <p className="mb-8 max-w-xl text-lg text-fd-muted-foreground md:text-xl">
        Comprehensive documentation for Discraft, a modern developer-friendly
        framework for building Discord bots with ease. Think of it as{" "}
        <span className="font-semibold">"Next.js for Discord bots"</span> —
        batteries included, ready to go.
      </p>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl">
        <Link
          href="/docs/dev"
          className="block rounded-lg border border-fd-border bg-fd-card p-6 text-left shadow-sm hover:shadow-md transition"
        >
          <h2 className="mb-2 text-xl font-bold">Development Mode</h2>
          <p className="text-fd-muted-foreground">
            Run your bot in development mode with hot reload.
          </p>
        </Link>
        <Link
          href="/docs/vercel-build"
          className="block rounded-lg border border-fd-border bg-fd-card p-6 text-left shadow-sm hover:shadow-md transition"
        >
          <h2 className="mb-2 text-xl font-bold">Vercel Deploys</h2>
          <p className="text-fd-muted-foreground">
            Deploy your bot serverlessly with Vercel.
          </p>
        </Link>
        <Link
          href="/docs/exec-build"
          className="block rounded-lg border border-fd-border bg-fd-card p-6 text-left shadow-sm hover:shadow-md transition"
        >
          <h2 className="mb-2 text-xl font-bold">Standalone Executable</h2>
          <p className="text-fd-muted-foreground">
            Build a single-file executable for any platform.
          </p>
        </Link>
      </div>

      <section className="max-w-2xl mx-auto">
        <h3 className="mb-2 text-2xl font-semibold">Why Discraft?</h3>
        <ul className="mb-8 text-left list-disc list-inside text-fd-muted-foreground">
          <li>
            <b>Zero-config to start:</b> Get going with a single command.
          </li>
          <li>
            <b>TypeScript-first:</b> Full TS support out of the box.
          </li>
          <li>
            <b>Hot reload/dev mode:</b> Iterate quickly.
          </li>
          <li>
            <b>Production builds:</b> Optimized output for fast, reliable bots.
          </li>
          <li>
            <b>Serverless ready:</b> Deploy to Vercel in minutes.
          </li>
        </ul>
        <Link
          href="/docs"
          className="inline-block rounded px-6 py-3 bg-fd-card text-fd-foreground font-bold shadow transition"
        >
          Explore the Docs
        </Link>
      </section>
    </main>
  );
}
