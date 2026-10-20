"use server";

import { User } from "@/types/user";
import { api } from "@/utils/apiHelper";
import { verifySession } from "@/lib/dal";

export async function getUserDetails(): Promise<User> {
  const { accessToken } = await verifySession();

  return await api<User>("user/me", accessToken);
}
