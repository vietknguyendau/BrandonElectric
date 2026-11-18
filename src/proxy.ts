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

  const needsSupabase = path.startsWith("/tracker") || path.startsWith("/api/bid-requests");
  if (needsSupabase && process.env.SUPABASE_URL) {
    const problem = supabaseConfigProblem(process.env.SUPABASE_URL);
    if (problem) {
      console.error(`[config] ${problem}`);
      if (path.startsWith("/api")) {
        return NextResponse.json(
          { ok: false, message: "Bid requests are temporarily unavailable. Please call instead." },
          { status: 503 },
        );
      }
      return new NextResponse(setupPage(problem), {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
      });
    }
  }

  if (path.startsWith("/tracker") && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const supabase = createServerClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_ANON_KEY.trim(), {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) req.cookies.set(name, value);
          res = NextResponse.next({ request: req });
          for (const { name, value, options } of list) res.cookies.set(name, value, options);
        },
      },
    });
    try {
      await supabase.auth.getUser();
    } catch (e) {
      // Can't reach Supabase: let the page decide (it will send the user to sign in).
      console.error("[proxy] Supabase session refresh failed", e);
    }
  }

  if (process.env.SITE_MODE !== "live" || path.startsWith("/tracker") || path.startsWith("/api")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

/** Plain-English description of a malformed SUPABASE_URL. Never echoes the value. */
function supabaseConfigProblem(raw: string): string | null {
  const v = raw.trim();
  if (/^["']|["']$/.test(v)) return "SUPABASE_URL has quote marks around it. Remove them.";
  if (!/^https:\/\//i.test(v)) return "SUPABASE_URL must start with https:// (for example https://abcd1234.supabase.co).";
  try {
    const u = new URL(v);
    if (u.pathname !== "/" && u.pathname !== "") {
      return "SUPABASE_URL should end at .supabase.co, with nothing after it (no /rest/v1 or dashboard link).";
    }
  } catch {
    return "SUPABASE_URL is not a valid web address.";
  }
  return null;
}

function setupPage(problem: string) {
  const esc = problem.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tracker setup needed</title></head>
<body style="font-family:system-ui,sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem;color:#24211f;background:#f8f3ea">
<h1 style="color:#5e1a28">Bid tracker setup needed</h1>
<p><strong>${esc}</strong></p>
<p>Fix it in Vercel under Settings &rarr; Environment Variables, then redeploy.</p></body></html>`;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
