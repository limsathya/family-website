import { NextResponse } from "next/server";
import { getUserById, updateUserProfile } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = requireAuth(async (_request, user) => {
  const u = await getUserById(user.userId);
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({
    id: u.id,
    name: u.name,
    name_zh: u.name_zh,
    name_km: u.name_km,
    email: u.email,
    role: u.role,
  });
});

export const PUT = requireAuth(async (request, user) => {
  const body = await request.json();
  const { name, name_zh, name_km } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await updateUserProfile(user.userId, {
    name: name.trim(),
    name_zh: name_zh?.trim() || null,
    name_km: name_km?.trim() || null,
  });

  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    name_zh: updated.name_zh,
    name_km: updated.name_km,
    email: updated.email,
    role: updated.role,
  });
});
