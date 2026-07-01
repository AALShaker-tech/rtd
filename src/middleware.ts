import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "@/lib/session";

type Role = SessionPayload["role"];

async function readSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Route → allowed roles. */
const GUARDS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/employee", roles: ["EMPLOYEE", "ADMIN"] },
  { prefix: "/driver", roles: ["DRIVER", "ADMIN"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login pages are always public.
  if (pathname.endsWith("/login")) return NextResponse.next();

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
    url.pathname =
      session.role === "ADMIN" ? "/admin" : session.role === "EMPLOYEE" ? "/employee" : "/driver";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/driver/:path*"],
};
