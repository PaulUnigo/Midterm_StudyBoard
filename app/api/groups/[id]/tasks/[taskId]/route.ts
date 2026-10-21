import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroupById, updateTask, deleteTask } from "@/lib/data";
import { updateTaskSchema } from "@/lib/validations";
import { emitGroup } from "@/lib/socket";

type Ctx = { params: Promise<{ id: string; taskId: string }> };

// PATCH /api/groups/:id/tasks/:taskId: update a task (owner only)
export async function PATCH(request: Request, { params }: Ctx) {
  const { id, taskId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsedResponse = updateTaskSchema.safeParse(body);
  if (!parsedResponse.success) {
    return NextResponse.json(
      { error: parsedResponse.error.issues[0].message },
      { status: 400 }
    );
  }

  const group = await getGroupById(id);
  if (!group) {
    return NextResponse.json(
      { error: "Group not found" },
      { status: 404 }
    );
  }

  if (group.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can modify this task" },
      { status: 403 }
    );
  }

  const updated = await updateTask(id, taskId, parsedResponse.data);

  if (!updated) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  emitGroup(id, "task:updated", updated, request.headers.get("x-socket-id"));

  return NextResponse.json(updated);
}

// DELETE /api/groups/:id/tasks/:taskId (owner only)
export async function DELETE(request: Request, { params }: Ctx) {
  const { id, taskId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await getGroupById(id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the group owner can delete this task" },
      { status: 403 }
    );
  }

  const deleted = await deleteTask(id, taskId);

  if (!deleted) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  emitGroup(
    id,
    "task:deleted",
    { taskId },
    request.headers.get("x-socket-id")
  );

  return NextResponse.json({ message: "Task deleted" });
}