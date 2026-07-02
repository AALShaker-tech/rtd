import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

type Role = SessionPayload["role"];

async function readSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Route → allowed roles. */
const GUARDS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/employee", roles: ["EMPLOYEE", "ADMIN", "SUPERADMIN"] },
  { prefix: "/driver", roles: ["DRIVER", "ADMIN", "SUPERADMIN"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login and first-time password setup pages are always public.
  if (pathname.endsWith("/login") || pathname.endsWith("/set-password")) return NextResponse.next();

  const guard = GUARDS.find((g) => pathname.startsWith(g.prefix));
  if (!guard) return NextResponse.next();

  const session = await readSession(req);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = `${guard.prefix}/login`;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (!guard.roles.includes(session.role)) {
    // Signed in but wrong role → send to their own area.
    const url = req.nextUrl.clone();
    url.pathname = isAdmin(session.role)
      ? "/admin"
      : session.role === "EMPLOYEE"
        ? "/employee"
        : "/driver";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/driver/:path*"],
};
