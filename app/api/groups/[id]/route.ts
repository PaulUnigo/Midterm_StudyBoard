import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroupById, updateGroup, deleteGroup } from "@/lib/data";
import { updateGroupSchema } from "@/lib/validations";
import { emitGroup } from "@/lib/socket";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  const group = await getGroupById(id);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsedResponse = updateGroupSchema.safeParse(body);
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
      { error: "Only the owner can modify this group" },
      { status: 403 }
    );
  }

  const updated = await updateGroup(id, parsedResponse.data);

  if (!updated) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { id } = await params;
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
      { error: "Only the owner can delete this group" },
      { status: 403 }
    );
  }

  const deleted = await deleteGroup(id);

  if (!deleted) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  emitGroup(id, "group:deleted", { groupId: id });

  return NextResponse.json({ message: "Group deleted" });
}