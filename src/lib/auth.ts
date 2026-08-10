import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set. Please check your .env file.");
  }
  return new TextEncoder().encode(secret);
}

interface AuthPayload {
  userId: number;
  email: string;
  name: string;
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

// Wrapper that injects user as second argument, keeps context as third
export function requireAuth<T>(
  handler: (req: NextRequest, user: AuthPayload, ctx: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ctx: T) => {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }
    return handler(request, user, ctx);
  };
}
