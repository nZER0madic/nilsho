"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// Schlüssel im localStorage: merkt sich die Adresse, an die der Link ging
const EMAIL_STORAGE_KEY = "emailForSignIn";

type SignInMethod = "password" | "emailLink";
type AuthMode = "signIn" | "signUp";

// Übersetzt Firebase-Fehlercodes in verständliche Meldungen
function getErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Die E-Mail-Adresse ist ungültig.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "E-Mail oder Passwort ist falsch.";
      case "auth/email-already-in-use":
        return "Für diese E-Mail-Adresse gibt es bereits ein Konto.";
      case "auth/weak-password":
        return "Das Passwort muss mindestens 6 Zeichen haben.";
      case "auth/missing-password":
        return "Bitte ein Passwort eingeben.";
      case "auth/too-many-requests":
        return "Zu viele Versuche. Bitte kurz warten.";
      case "auth/invalid-action-code":
      case "auth/expired-action-code":
        return "Der Anmeldelink ist ungültig oder abgelaufen.";
      case "auth/operation-not-allowed":
        return "Diese Anmeldemethode ist in Firebase nicht aktiviert.";
      case "auth/unauthorized-continue-uri":
        return "Diese Domain ist in Firebase nicht als autorisiert eingetragen.";
      case "auth/network-request-failed":
        return "Keine Verbindung zum Server.";
    }
  }
  return "Etwas ist schiefgelaufen. Bitte erneut versuchen.";
}

export default function AuthPage() {
  const router = useRouter();
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("password");
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // true, wenn die Seite über einen Anmeldelink geöffnet wurde, die Adresse
  // aber nicht gespeichert ist (z. B. Link auf anderem Gerät geöffnet)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  // Schutz gegen doppelte Ausführung im React Strict Mode –
  // ein Link ist nur einmal gültig
  const hasProcessedEmailLink = useRef(false);

  function clearMessages() {
    setErrorMessage("");
    setInfoMessage("");
  }

  // Bereits angemeldet? Dann direkt zur Hauptseite
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) router.replace("/");
    });
    return unsubscribe;
  }, [router]);

  // Anmeldelink aus der E-Mail verarbeiten
  useEffect(() => {
    if (hasProcessedEmailLink.current) return;
    hasProcessedEmailLink.current = true;

    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    const storedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (storedEmail) {
      completeEmailLinkSignIn(storedEmail);
    } else {
      setSignInMethod("emailLink");
      setNeedsEmailConfirmation(true);
      setInfoMessage(
        "Bitte bestätige Deine E-Mail-Adresse, um die Anmeldung abzuschließen."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function completeEmailLinkSignIn(emailAddress: string) {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await signInWithEmailLink(auth, emailAddress, window.location.href);
      window.localStorage.removeItem(EMAIL_STORAGE_KEY);
      router.replace("/");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Bitte E-Mail-Adresse eingeben.");
      return;
    }

    if (needsEmailConfirmation) {
      await completeEmailLinkSignIn(trimmedEmail);
      return;
    }

    setIsLoading(true);
    try {
      if (signInMethod === "emailLink") {
        // Der Link führt zurück auf diese Seite, die ihn dann einlöst
        await sendSignInLinkToEmail(auth, trimmedEmail, {
          url: `${window.location.origin}/auth`,
          handleCodeInApp: true,
        });
        window.localStorage.setItem(EMAIL_STORAGE_KEY, trimmedEmail);
        setInfoMessage(
          `Link gesendet an ${trimmedEmail}. Bitte Postfach und Spam-Ordner prüfen.`
        );
      } else if (authMode === "signIn") {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        router.replace("/");
      } else {
        await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        router.replace("/");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordReset() {
    clearMessages();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Bitte zuerst die E-Mail-Adresse eingeben.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setInfoMessage(
        `Falls ein Konto existiert, wurde eine E-Mail an ${trimmedEmail} gesendet.`
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  function toggleAuthMode() {
    setAuthMode(authMode === "signIn" ? "signUp" : "signIn");
    clearMessages();
  }

  const submitButtonLabel = needsEmailConfirmation
    ? "Anmeldung abschließen"
    : signInMethod === "emailLink"
      ? "Link senden"
      : authMode === "signIn"
        ? "Anmelden"
        : "Konto erstellen";

  const showPasswordForm = signInMethod === "password" && !needsEmailConfirmation;
  const showEmailLinkHint = signInMethod === "emailLink" && !needsEmailConfirmation;

  // Horizontale Streifen in der unteren Hälfte der Sonne, typisch für den 80er-Look
  const sunStripeMask =
    "linear-gradient(to bottom, #000 0 55%, transparent 55% 59%, #000 59% 67%, transparent 67% 72%, #000 72% 79%, transparent 79% 85%, #000 85% 90%, transparent 90% 97%, #000 97%)";
  const gridFadeMask = "linear-gradient(to top, #000 30%, transparent)";

  const inputClassName =
    "h-12 rounded-2xl border border-sky-200 bg-white/80 px-4 text-sky-950 outline-none transition placeholder:text-sky-300 focus:border-[#ff4fa3] focus:ring-4 focus:ring-[#ff4fa3]/20";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#9be7ff] via-[#d6f4ff] to-[#ffd1ea] px-4 py-12 font-sans">
      {/* ---------- Dekoration: Retro-Sonne ---------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[8%] h-80 w-80 -translate-x-1/2 rounded-full opacity-80"
        style={{
          background: "linear-gradient(to bottom, #ff4fa3, #ff8ac4 45%, #ffb86b)",
          maskImage: sunStripeMask,
          WebkitMaskImage: sunStripeMask,
        }}
      />

      {/* ---------- Dekoration: Neon-Gitterboden ---------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-1/2 h-72 w-[200%] -translate-x-1/2"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,79,163,0.45) 2px, transparent 2px), linear-gradient(90deg, rgba(255,79,163,0.45) 2px, transparent 2px)",
          backgroundSize: "60px 40px",
          transform: "translateX(-50%) perspective(400px) rotateX(60deg)",
          transformOrigin: "bottom",
          maskImage: gridFadeMask,
          WebkitMaskImage: gridFadeMask,
        }}
      />

      {/* ---------- Karte ---------- */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/70 bg-white/65 p-8 shadow-[0_0_50px_rgba(255,79,163,0.30)] backdrop-blur-xl">
        <h1 className="bg-gradient-to-r from-[#1cb5e0] to-[#ff4fa3] bg-clip-text text-center text-4xl font-extrabold tracking-tight text-transparent">
          {authMode === "signUp" && signInMethod === "password"
            ? "Konto erstellen"
            : "Willkommen"}
        </h1>
        <p className="mt-2 text-center text-sm text-sky-900/70">
          Melde Dich an, um fortzufahren.
        </p>

        {/* Umschalter zwischen den Methoden */}
        {!needsEmailConfirmation && (
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-sky-100/80 p-1">
            {(["password", "emailLink"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setSignInMethod(method);
                  clearMessages();
                }}
                className={`h-10 rounded-full text-sm font-semibold transition-all ${
                  signInMethod === method
                    ? "bg-white text-[#ff4fa3] shadow-[0_2px_12px_rgba(255,79,163,0.35)]"
                    : "text-sky-800/70 hover:text-sky-900"
                }`}
              >
                {method === "password" ? "E-Mail & Passwort" : "E-Mail-Link"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-900/70">
              E-Mail
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="du@beispiel.de"
              className={inputClassName}
            />
          </label>

          {showPasswordForm && (
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-sky-900/70">
                Passwort
                {authMode === "signIn" && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="normal-case tracking-normal text-[#ff4fa3] hover:underline"
                  >
                    Vergessen?
                  </button>
                )}
              </span>
              <input
                type="password"
                autoComplete={authMode === "signIn" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={inputClassName}
              />
            </label>
          )}

          {showEmailLinkHint && (
            <p className="text-sm text-sky-900/70">
              Du bekommst einen Link per E-Mail – ein Klick darauf meldet Dich ohne Passwort an.
            </p>
          )}

          {/* Rückmeldungen */}
          {errorMessage && (
            <p className="rounded-2xl border border-[#ff4fa3]/40 bg-[#ff4fa3]/10 px-4 py-3 text-sm text-[#c2185b]">
              {errorMessage}
            </p>
          )}
          {infoMessage && (
            <p className="rounded-2xl border border-sky-300 bg-sky-100/80 px-4 py-3 text-sm text-sky-900">
              {infoMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-12 rounded-2xl bg-gradient-to-r from-[#ff4fa3] to-[#ff7ac0] font-semibold text-white shadow-[0_6px_24px_rgba(255,79,163,0.45)] transition hover:shadow-[0_8px_32px_rgba(255,79,163,0.65)] hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Bitte warten …" : submitButtonLabel}
          </button>
        </form>

        {/* Wechsel zwischen Anmelden und Registrieren */}
        {showPasswordForm && (
          <p className="mt-6 text-center text-sm text-sky-900/70">
            {authMode === "signIn" ? "Noch kein Konto?" : "Schon registriert?"}{" "}
            <button
              type="button"
              onClick={toggleAuthMode}
              className="font-semibold text-[#ff4fa3] hover:underline"
            >
              {authMode === "signIn" ? "Jetzt registrieren" : "Zur Anmeldung"}
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
