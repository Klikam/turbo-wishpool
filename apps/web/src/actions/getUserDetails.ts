"use server";

import { getServerSession } from "next-auth";
import { User } from "@/types/user";
import { api } from "@/utils/apiHelper";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getUserDetails(): Promise<User> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authorized");

  const id = session.user.id;
  const accessToken = session.backendTokens?.accessToken;
  if (!accessToken) throw new Error("Not authorized");

  const [user] = await api<User[]>(`user/${id}`, accessToken);
  if (!user) throw new Error("User not found");

  return user;
}
