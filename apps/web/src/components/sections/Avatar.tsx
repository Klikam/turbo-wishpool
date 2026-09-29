"use client";

import { useState, useTransition } from "react";
import { getUserDetails } from "@/actions/getUserDetails";
import { User } from "@/types/user";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const colors = ["bg-[#7A3F78]", "bg-[#C4797A]", "bg-[#4A1942]", "bg-[#B07B8A]"];

export default function Avatar({ name, size = "md" }: AvatarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayName = user?.name ?? name; // adjust to your User type's field

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const color = colors[displayName.charCodeAt(0) % colors.length];
  const sz =
    size === "sm"
      ? "w-7 h-7 text-xs"
      : size === "lg"
        ? "w-12 h-12 text-lg"
        : "w-9 h-9 text-sm";

  const handleClick = () => {
    startTransition(async () => {
      try {
        setUser(await getUserDetails());
      } catch (e) {
        console.error(e);
      }
    });
  };

  return (
    <div
      onClick={handleClick}
      title={user?.email}
      className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0 cursor-pointer ${isPending ? "opacity-60" : ""}`}
    >
      {initials}
    </div>
  );
}
