"use client";

import { useState } from "react";
import { followUser, unfollowUser } from "@/lib/social";

export default function FollowButton({
  uid, name, myName, initialFollowing = false, size = "md", onChange,
}: {
  uid: string; name: string; myName: string; initialFollowing?: boolean; size?: "sm" | "md"; onChange?: (following: boolean) => void;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    onChange?.(next);
    const ok = next ? await followUser(uid, name, myName) : await unfollowUser(uid);
    if (!ok) { setFollowing(!next); onChange?.(!next); }
    setBusy(false);
  };

  const pad = size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-[12px]";
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-full font-bold active:opacity-85 disabled:opacity-50 transition-colors ${pad} ${
        following ? "bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300" : "bg-[#F9954E] text-white"
      }`}
    >
      {following ? "팔로잉" : "팔로우"}
    </button>
  );
}
