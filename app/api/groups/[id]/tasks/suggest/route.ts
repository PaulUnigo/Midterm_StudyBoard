import {
  AIBadResponseError,
  AIFeatureUnavailableError,
  generateSubtaskSuggestions,
} from "@/lib/ai";
import { authOptions } from "@/lib/auth";
import { getGroupById } from "@/lib/data";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";

const suggestSchema = z.object({
  topic: z.string().trim().min(1, "A topic is required").max(200),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = suggestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const group = await getGroupById(id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can suggest tasks for this group" },
      { status: 403 }
    );
  }

  try {
    const subtasks = await generateSubtaskSuggestions(
      parsed.data.topic,
      group.name
    );
    return NextResponse.json({ subtasks });
  } catch (error) {
    if (error instanceof AIFeatureUnavailableError) {
      return NextResponse.json(
        { error: "AI feature is currently unavailable" },
        { status: 503 }
      );
    }
    if (axios.isAxiosError(error) || error instanceof AIBadResponseError) {
      return NextResponse.json(
        { error: "AI feature is currently unavailable, please try again later." },
        { status: 502 }
      );
    }
    console.error("Suggest route error:", error);
    return NextResponse.json(
      { error: "Something went wrong generating suggestions." },
      { status: 500 }
    );
  }
}