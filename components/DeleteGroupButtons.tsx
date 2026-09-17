"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This cannot be undone."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError("");

    const res = await fetch(`/api/groups/${groupId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setIsDeleting(false);
      setError("Failed to delete group");
      return;
    }

    router.push("/groups");
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="whitespace-nowrap rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {isDeleting ? "Deleting..." : "Delete Group"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}













// "use client";

// import {useState} from "react";
// import {useRouter} from "next/navigation";

// export default function DeleteGroupButton({groupId}: {groupId: string}) {
//     const router = useRouter();
//     const [isDeleting, setIsDeleting] = useState(false);
//     const [error, setError] = useState("");

//     async function handleDelete() {
//         setError("TODO: implement-group handler");
//     }

//     return (
//         <div>
//             <button
//                 onClick={handleDelete}
//                 disabled={isDeleting}
//                 className="whitespace-nowrap rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
//             >
//                 {isDeleting ? "Deleting..." : "Delete Group"}
//             </button>
//             {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
//         </div>

//     )
// }