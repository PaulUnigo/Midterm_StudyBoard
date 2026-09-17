import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getGroupById } from "@/lib/data";
import { authOptions } from "@/lib/auth";
import DeleteGroupButton from "@/components/DeleteGroupButtons";
import NewTaskForm from "@/components/NewTaskForm";
import TaskItem from "@/components/TaskItem";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>; // 👈 1. Change type to Promise
}) {
  // 👈 2. Await params first to unwrap the object
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const [group, session] = await Promise.all([
    getGroupById(id), // 👈 3. Use the resolved id here
    getServerSession(authOptions),
  ]);

  if (!group) {
    notFound();
  }

  const isOwner = session?.user.id === group.ownerId;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-gray-500">
            {group.subject} · {group.memberCount} members · Created by{" "}
            {group.owner.name}
          </p>
        </div>
        {isOwner && <DeleteGroupButton groupId={group.id} />}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {isOwner && <NewTaskForm groupId={group.id} />}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {group.tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            groupId={group.id}
            isOwner={isOwner}
          />
        ))}
      </ul>
    </div>
  );
}