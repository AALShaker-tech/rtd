import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "rtd_session";

interface Session {
  userId: string;
  role: "ADMIN" | "EMPLOYEE" | "DRIVER";
}

async function readSession(req: NextRequest): Promise<Session | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return { userId: String(payload.userId), role: payload.role as Session["role"] };
  } catch {
    return null;
  }
}

/** Route → allowed roles. */
const GUARDS: { prefix: string; roles: Session["role"][] }[] = [
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
