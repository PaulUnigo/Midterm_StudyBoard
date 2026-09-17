import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroupById, updateGroup, deleteGroup } from "@/lib/data";
import { updateGroupSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Type as Promise
) {
  const { id } = await params; // 2. Await params
  const group = await getGroupById(id);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Type as Promise
) {
  const { id } = await params; // 2. Await params
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
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
    return NextResponse.json(
      { error: "Group not found" }, 
      { status: 404 }
    );
  }

  if (group.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can modify this group" },
      { status: 403 }
    );
  }

  const updated = await updateGroup(id, body);

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Type as Promise
) {
  const { id } = await params; // 2. Await params
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
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
      { error: "Only the owner can delete this group" },
      { status: 403 }
    );
  }

  const deleted = await deleteGroup(id);

  if (!deleted) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Group deleted" });
}