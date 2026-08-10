import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, updateUserRole, toggleUserActive, deleteUser, createUser, createRedeemCode, getUserByEmail } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Anyone logged in can view users (for chat display names, etc.)
export const GET = requireAuth(async () => {
  const users = await getAllUsers().map(({ password, ...u }) => u);
  return NextResponse.json(users);
});

// Only admins can change roles or toggle active status
export const PUT = requireAdmin(async (request: NextRequest) => {
  const body = await request.json();
  const { id, role, toggleActive } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  if (role) await updateUserRole(id, role);
  if (toggleActive) await toggleUserActive(id);
  return NextResponse.json({ success: true });
});

// Only admins can invite users
export const POST = requireAdmin(async (request: NextRequest) => {
  const body = await request.json();
  const { name, email, role, nameZh, nameKm } = body;
  if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });

  // Check if user already exists
  const existing = await getUserByEmail(email);
  if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 });

  // Generate random password and hash
  const tempPassword = crypto.randomBytes(8).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  const user = await createUser(name, email, hashedPassword, 1, nameZh, nameKm);

  // Set role if specified
  if (role) await updateUserRole(user.id, role);

  // Generate a redeem code for the invited user
  const code = `LS-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const d = new Date();
  d.setDate(d.getDate() + 30);
  await createRedeemCode(code, 1, d.toISOString().split("T")[0], (request as any)._userId || null);

  return NextResponse.json({
    user: { id: user.id, name, email, role: role || "editor" },
    redeemCode: code,
    tempPassword,
  }, { status: 201 });
});

// Only admins can delete users
export const DELETE = requireAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await deleteUser(Number(id));
  return NextResponse.json({ success: true });
});
