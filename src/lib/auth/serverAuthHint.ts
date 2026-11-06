import { cookies } from "next/headers";
import { ACCESS_TOKEN_KEY } from "@/lib/api/storage";

const LEGACY_ACCESS_TOKEN_KEY = "quizlet_access_token";

/**
 * Server-side auth hint for the single-URL `/` home.
 *
 * Googlebot never sends auth cookies, so it always gets `{ hasToken: false }`
 * and the fully SSR'd landing (SEO unchanged). A logged-in browser sends
 * `flashwise_access_token` (written by `setAccessToken` alongside
 * localStorage), so the server can render the dashboard skeleton with the
 * correct dimensions on the very first paint instead of the full landing.
 *
 * This is only a hint, never a trust decision: the client still verifies the
 * session via `apiGetProfile()` + refresh fallback before showing real data.
 */
export interface ServerAuthHint {
  hasToken: boolean;
}

function cookieHasValue(
  store: { get: (name: string) => { value?: string } | undefined },
  names: string[]
): boolean {
  for (const name of names) {
    try {
      const value = store.get(name)?.value;
      if (value && value.trim().length > 0) return true;
    } catch {
      // Ignore malformed cookie entries.
    }
  }
  return false;
}

export async function getServerAuthHint(): Promise<ServerAuthHint> {
  try {
    // Next 15 exposes `cookies()` as async; older versions are sync.
    // `await` works for both shapes.
    const store = await cookies();
    const hasToken = cookieHasValue(store as never, [
      ACCESS_TOKEN_KEY,
      LEGACY_ACCESS_TOKEN_KEY,
    ]);
    return { hasToken };
  } catch {
    // Never break SSR/SEO when cookies() is unavailable (static export, tests).
    return { hasToken: false };
  }
}
