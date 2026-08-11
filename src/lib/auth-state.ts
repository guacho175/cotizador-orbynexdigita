import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

let currentUser: User | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initAuthState() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // getSession reads from local storage and doesn't fail if offline
      // unless the token needs refresh and network is down, but even then
      // we don't want to blindly boot them out if it's a network error.
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // We only boot them if there is a clear auth error that means session is invalid
      // (though usually getSession just returns null if no session)
      if (!error && session) {
        currentUser = session.user;
      }
    } catch (e) {
      console.error("Error fetching initial session:", e);
    } finally {
      isInitialized = true;
    }
  })();

  return initPromise;
}

export function getAuthUser() {
  return currentUser;
}

// Keep the state updated automatically
supabase.auth.onAuthStateChange((event, session) => {
  if (
    event === "SIGNED_IN" ||
    event === "USER_UPDATED" ||
    event === "TOKEN_REFRESHED"
  ) {
    currentUser = session?.user ?? null;
  } else if (event === "SIGNED_OUT") {
    currentUser = null;
  }
});
