import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroupById, createTask } from "@/lib/data";
import { createTaskSchema } from "@/lib/validations";
import { emitGroup } from "@/lib/socket";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  const group = await getGroupById(id);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group.tasks);
}

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsedResponse = createTaskSchema.safeParse(body);
  if (!parsedResponse.success) {
    return NextResponse.json(
      { error: parsedResponse.error.issues[0].message },
      { status: 400 }
    );
  }

  const group = await getGroupById(id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can add task to this group" },
      { status: 403 }
    );
  }

  const newTask = await createTask(id, parsedResponse.data.title);

  emitGroup(
    id,
    "task:created",
    newTask,
    request.headers.get("x-socket-id")
  );

  return NextResponse.json(newTask, { status: 201 });
}