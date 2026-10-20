import { ApiError } from "@/utils/apiHelper";

/** Return type of server actions whose failures the UI shows to the user. */
export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string };

/** Runs a backend call, turning backend errors into a displayable result. */
export async function toResult<T>(
  run: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    throw e;
  }
}
