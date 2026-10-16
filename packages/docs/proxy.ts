import { NextRequest, NextResponse } from "next/server";
import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { docsContentRoute, docsRoute } from "@/lib/shared";
import { source } from "@/lib/source";

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`,
);

// Unknown docs pages would otherwise get the streamed fallback shell (200) on
// their first request, so reject them here where the status can still be set.
// See https://nextjs.org/docs/app/api-reference/functions/not-found
function isUnknownDocsPage(pathname: string) {
  if (pathname !== docsRoute && !pathname.startsWith(`${docsRoute}/`)) {
    return false;
  }

  try {
    const slugs = pathname
      .slice(docsRoute.length)
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent);

    return !source.getPage(slugs);
  } catch {
    // malformed escape sequences (e.g. `%E0`) can't match any page
    return true;
  }
}

export default function proxy(request: NextRequest) {
  const result = rewriteSuffix(request.nextUrl.pathname);
  if (result) {
    return NextResponse.rewrite(new URL(result, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const result = rewriteDocs(request.nextUrl.pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl), {
        // this URL has two representations, selected by `Accept`
        headers: { Vary: "Accept" },
      });
    }
  }

  if (isUnknownDocsPage(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL("/_not-found", request.nextUrl), {
      status: 404,
    });
  }

  return NextResponse.next();
}
