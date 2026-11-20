"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prüft den Anmeldestatus. Nicht angemeldet → weiter zur Anmeldeseite.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }
      setUser(currentUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [router]);

  async function handleSignOut() {
    // Nach dem Abmelden leitet onAuthStateChanged automatisch zu /auth
    await signOut(auth);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-zinc-500">
        Lädt …
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Willkommen</h1>
      <p className="text-zinc-600">
        Angemeldet als <span className="font-medium">{user?.email}</span>
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        className="h-11 rounded-full border border-[#ff4fa3] px-6 font-medium text-[#ff4fa3] transition-colors hover:bg-[#ff4fa3] hover:text-white"
      >
        Abmelden
      </button>
    </main>
  );
}
