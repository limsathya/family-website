import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { getJwtSecret } from "@/lib/jwt-secret";

interface AuthPayload {
  userId: number;
  email: string;
  name: string;
  role?: string;
}

export async function getAuthUser(request: NextRequest): Promise<AuthPayload | null> {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

// Wrapper that injects user as second argument
export function requireAuth(
  handler: (req: NextRequest, user: AuthPayload, ...rest: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...rest: any[]) => {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }
    (request as any)._userId = user.userId;
    return handler(request, user, ...rest);
  };
}

// Wrapper that requires admin role
export function requireAdmin(
  handler: (req: NextRequest, user: AuthPayload, ...rest: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...rest: any[]) => {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }
    (request as any)._userId = user.userId;
    return handler(request, user, ...rest);
  };
}
