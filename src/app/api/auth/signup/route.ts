import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser, getRedeemCode, markRedeemCodeUsed } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, redeemCode, nameZh, nameKm } = body;

    if (!name || !email || !password || !redeemCode) {
      return NextResponse.json(
        { error: "Name, email, password, and redeem code are required" },
        { status: 400 }
      );
    }

    // Restrict to allowed domain
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "limsathya.com";
    if (!email.endsWith(`@${allowedDomain}`)) {
      return NextResponse.json(
        { error: `Only @${allowedDomain} email addresses are allowed to register` },
        { status: 403 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Validate redeem code
    const code = await getRedeemCode(redeemCode);
    if (!code) {
      return NextResponse.json(
        { error: "Invalid redeem code" },
        { status: 400 }
      );
    }
    // Check expiry
    if (code.expires_at) {
      const now = new Date();
      const expiry = new Date(code.expires_at + "Z");
      if (now > expiry) {
        return NextResponse.json(
          { error: "This redeem code has expired" },
          { status: 400 }
        );
      }
    }
    // Check usage limit
    if (code.use_count >= code.max_uses) {
      return NextResponse.json(
        { error: "This redeem code has reached its usage limit" },
        { status: 400 }
      );
    }

    // Hash password and create user (active immediately since code is valid)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(name, email, hashedPassword, 1, nameZh, nameKm);

    // Mark redeem code as used
    await markRedeemCodeUsed(redeemCode, user.id);

    return NextResponse.json(
      { id: user.id, name: user.name, name_zh: user.name_zh, name_km: user.name_km, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
