import { NextRequest, NextResponse } from "next/server";
import { getAllEvents, createEvent, EventInput } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async () => {
  try {
    return NextResponse.json(getAllEvents());
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
};

export const POST = requireAuth(async (request: NextRequest) => {
  const body: EventInput = await request.json();
  if (!body.title || !body.date) {
    return NextResponse.json({ error: "title and date are required" }, { status: 400 });
  }
  const event = createEvent(body);
  return NextResponse.json(event, { status: 201 });
});
