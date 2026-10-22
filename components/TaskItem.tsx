"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/lib/data";
import { socket } from "@/lib/socketClient";

export default function TaskItem({
  task,
  isOwner,
  groupId,
}: {
  task: Task;
  isOwner: boolean;
  groupId: string;
}) {
  const router = useRouter();
  const [done, setDone] = useState(task.done);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleToggle() {
    if (!isOwner) return;

    const previousValue = done;
    const newValue = !done;

    setDone(newValue);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Socket-Id": socket.id ?? "",
        },
        body: JSON.stringify({ done: newValue }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setDone(previousValue);
        setError(data?.error ?? "Couldn't update task.");
      }
    } catch {
      setDone(previousValue);
      setError("Network error. Please try again.");
    }
  }

  async function handleDelete() {
    if (!isOwner) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/tasks/${task.id}`, {
        method: "DELETE",
        headers: { "X-Socket-Id": socket.id ?? "" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setIsDeleting(false);
        setError(data?.error ?? "Couldn't delete task.");
        return;
      }

      router.refresh();
    } catch {
      setIsDeleting(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-md border px-3 py-2 text-pink-700 hover:bg-pink-100">
      <input
        type="checkbox"
        checked={done}
        disabled={!isOwner}
        onChange={handleToggle}
        className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className={done ? "line-through text-pink-400" : ""}>
        {task.title}
      </span>
      {isOwner && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="ml-auto text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </li>
  );
}