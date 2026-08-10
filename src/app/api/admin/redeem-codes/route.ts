import { NextRequest, NextResponse } from "next/server";
import { getAllRedeemCodes, createRedeemCode, deleteRedeemCode } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

export const GET = requireAdmin(async () => {
  const codes = await getAllRedeemCodes();
  return NextResponse.json(codes);
});

export const POST = requireAdmin(async (request: NextRequest) => {
  const body = await request.json();
  const count = body.count || 1;
  const maxUses = body.maxUses || 1;
  const expiresInDays = body.expiresInDays || null;
  const createdBy = (request as any)._userId || null;

  let expiresAt: string | null = null;
  if (expiresInDays) {
    const d = new Date();
    d.setDate(d.getDate() + expiresInDays);
    expiresAt = d.toISOString().split("T")[0];
  }

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = `LS-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    await createRedeemCode(code, maxUses, expiresAt, createdBy);
    codes.push(code);
  }

  return NextResponse.json({ codes }, { status: 201 });
});

export const DELETE = requireAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await deleteRedeemCode(Number(id));
  return NextResponse.json({ success: true });
});
