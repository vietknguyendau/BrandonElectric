import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 1. Private preview gate: if PREVIEW_ACCESS_PASSWORD is set, the whole site
 *    asks for a password (HTTP Basic Auth). Use it on any deployed preview.
 * 2. Keeps the Supabase staff session fresh on /tracker.
 * 3. Marks the preview and the tracker as noindex.
 */
export async function proxy(req: NextRequest) {
  const gate = process.env.PREVIEW_ACCESS_PASSWORD;
  if (gate) {
    const header = req.headers.get("authorization") ?? "";
    const [scheme, encoded] = header.split(" ");
    let ok = false;
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      ok = decoded.slice(decoded.indexOf(":") + 1) === gate;
    }
    if (!ok) {
      return new NextResponse("Private preview", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Brandon Electric preview"' },
      });
    }
  }

  let res = NextResponse.next({ request: req });
  const path = req.nextUrl.pathname;

  if (path.startsWith("/tracker") && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const supabase = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) req.cookies.set(name, value);
          res = NextResponse.next({ request: req });
          for (const { name, value, options } of list) res.cookies.set(name, value, options);
        },
      },
    });
    await supabase.auth.getUser();
  }

  if (process.env.SITE_MODE !== "live" || path.startsWith("/tracker") || path.startsWith("/api")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
