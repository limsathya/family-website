import { NextRequest, NextResponse } from "next/server";
import { getChatMessagesWithNames, createChatMessage } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = requireAuth(async () => {
  try {
    return NextResponse.json(await getChatMessagesWithNames(100));
  } catch {
    return NextResponse.json([]);
  }
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { message } = body;
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    const msg = await createChatMessage(user.userId, user.name, message.trim());
    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
});
