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
const EMAIL_SPEICHER = "emailFuerAnmeldung";

type Methode = "passwort" | "link";
type Modus = "anmelden" | "registrieren";

// Übersetzt Firebase-Fehlercodes in verständliche Meldungen
function fehlertext(e: unknown) {
  if (e instanceof FirebaseError) {
    switch (e.code) {
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
  const [methode, setMethode] = useState<Methode>("passwort");
  const [modus, setModus] = useState<Modus>("anmelden");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState("");
  const [info, setInfo] = useState("");

  // true, wenn die Seite über einen Anmeldelink geöffnet wurde, die Adresse
  // aber nicht gespeichert ist (z. B. Link auf anderem Gerät geöffnet)
  const [linkBestaetigen, setLinkBestaetigen] = useState(false);

  // Schutz gegen doppelte Ausführung im React Strict Mode – ein Link
  // ist nur einmal gültig
  const linkVerarbeitet = useRef(false);

  // Bereits angemeldet? Dann direkt zur Hauptseite
  useEffect(() => {
    const abmelden = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/");
    });
    return abmelden;
  }, [router]);

  // Anmeldelink aus der E-Mail verarbeiten
  useEffect(() => {
    if (linkVerarbeitet.current) return;
    linkVerarbeitet.current = true;

    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    const gespeichert = window.localStorage.getItem(EMAIL_SPEICHER);
    if (gespeichert) {
      linkAbschliessen(gespeichert);
    } else {
      setMethode("link");
      setLinkBestaetigen(true);
      setInfo("Bitte bestätige Deine E-Mail-Adresse, um die Anmeldung abzuschließen.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function linkAbschliessen(adresse: string) {
    setLaedt(true);
    setFehler("");
    try {
      await signInWithEmailLink(auth, adresse, window.location.href);
      window.localStorage.removeItem(EMAIL_SPEICHER);
      router.replace("/");
    } catch (e) {
      setFehler(fehlertext(e));
    } finally {
      setLaedt(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFehler("");
    setInfo("");

    const adresse = email.trim();
    if (!adresse) {
      setFehler("Bitte E-Mail-Adresse eingeben.");
      return;
    }

    if (linkBestaetigen) {
      await linkAbschliessen(adresse);
      return;
    }

    setLaedt(true);
    try {
      if (methode === "link") {
        // Der Link führt zurück auf diese Seite, die ihn dann einlöst
        await sendSignInLinkToEmail(auth, adresse, {
          url: `${window.location.origin}/auth`,
          handleCodeInApp: true,
        });
        window.localStorage.setItem(EMAIL_SPEICHER, adresse);
        setInfo(`Link gesendet an ${adresse}. Bitte Postfach und Spam-Ordner prüfen.`);
      } else if (modus === "anmelden") {
        await signInWithEmailAndPassword(auth, adresse, passwort);
        router.replace("/");
      } else {
        await createUserWithEmailAndPassword(auth, adresse, passwort);
        router.replace("/");
      }
    } catch (err) {
      setFehler(fehlertext(err));
    } finally {
      setLaedt(false);
    }
  }

  async function handlePasswortVergessen() {
    setFehler("");
    setInfo("");
    const adresse = email.trim();
    if (!adresse) {
      setFehler("Bitte zuerst die E-Mail-Adresse eingeben.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, adresse);
      setInfo(`Falls ein Konto existiert, wurde eine E-Mail an ${adresse} gesendet.`);
    } catch (err) {
      setFehler(fehlertext(err));
    }
  }

  const buttonText = linkBestaetigen
    ? "Anmeldung abschließen"
    : methode === "link"
      ? "Link senden"
      : modus === "anmelden"
        ? "Anmelden"
        : "Konto erstellen";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#9be7ff] via-[#d6f4ff] to-[#ffd1ea] px-4 py-12 font-sans">
      {/* ---------- Dekoration: Retro-Sonne ---------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[8%] h-80 w-80 -translate-x-1/2 rounded-full opacity-80"
        style={{
          background: "linear-gradient(to bottom, #ff4fa3, #ff8ac4 45%, #ffb86b)",
          // Horizontale Streifen in der unteren Hälfte, typisch für den 80er-Look
          maskImage:
            "linear-gradient(to bottom, #000 0 55%, transparent 55% 59%, #000 59% 67%, transparent 67% 72%, #000 72% 79%, transparent 79% 85%, #000 85% 90%, transparent 90% 97%, #000 97%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 0 55%, transparent 55% 59%, #000 59% 67%, transparent 67% 72%, #000 72% 79%, transparent 79% 85%, #000 85% 90%, transparent 90% 97%, #000 97%)",
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
          maskImage: "linear-gradient(to top, #000 30%, transparent)",
          WebkitMaskImage: "linear-gradient(to top, #000 30%, transparent)",
        }}
      />

      {/* ---------- Karte ---------- */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/70 bg-white/65 p-8 shadow-[0_0_50px_rgba(255,79,163,0.30)] backdrop-blur-xl">
        <h1 className="bg-gradient-to-r from-[#1cb5e0] to-[#ff4fa3] bg-clip-text text-center text-4xl font-extrabold tracking-tight text-transparent">
          {modus === "registrieren" && methode === "passwort"
            ? "Konto erstellen"
            : "Willkommen"}
        </h1>
        <p className="mt-2 text-center text-sm text-sky-900/70">
          Melde Dich an, um fortzufahren.
        </p>

        {/* Umschalter zwischen den Methoden */}
        {!linkBestaetigen && (
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-sky-100/80 p-1">
            {(["passwort", "link"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMethode(m);
                  setFehler("");
                  setInfo("");
                }}
                className={`h-10 rounded-full text-sm font-semibold transition-all ${
                  methode === m
                    ? "bg-white text-[#ff4fa3] shadow-[0_2px_12px_rgba(255,79,163,0.35)]"
                    : "text-sky-800/70 hover:text-sky-900"
                }`}
              >
                {m === "passwort" ? "E-Mail & Passwort" : "E-Mail-Link"}
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="max.mustermann@beispiel.de"
              className="h-12 rounded-2xl border border-sky-200 bg-white/80 px-4 text-sky-950 outline-none transition placeholder:text-sky-300 focus:border-[#ff4fa3] focus:ring-4 focus:ring-[#ff4fa3]/20"
            />
          </label>

          {methode === "passwort" && !linkBestaetigen && (
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-sky-900/70">
                Passwort
                {modus === "anmelden" && (
                  <button
                    type="button"
                    onClick={handlePasswortVergessen}
                    className="normal-case tracking-normal text-[#ff4fa3] hover:underline"
                  >
                    Vergessen?
                  </button>
                )}
              </span>
              <input
                type="password"
                autoComplete={modus === "anmelden" ? "current-password" : "new-password"}
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-2xl border border-sky-200 bg-white/80 px-4 text-sky-950 outline-none transition placeholder:text-sky-300 focus:border-[#ff4fa3] focus:ring-4 focus:ring-[#ff4fa3]/20"
              />
            </label>
          )}

          {methode === "link" && !linkBestaetigen && (
            <p className="text-sm text-sky-900/70">
              Du bekommst einen Link per E-Mail – ein Klick darauf meldet Dich ohne Passwort an.
            </p>
          )}

          {/* Rückmeldungen */}
          {fehler && (
            <p className="rounded-2xl border border-[#ff4fa3]/40 bg-[#ff4fa3]/10 px-4 py-3 text-sm text-[#c2185b]">
              {fehler}
            </p>
          )}
          {info && (
            <p className="rounded-2xl border border-sky-300 bg-sky-100/80 px-4 py-3 text-sm text-sky-900">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={laedt}
            className="mt-2 h-12 rounded-2xl bg-gradient-to-r from-[#ff4fa3] to-[#ff7ac0] font-semibold text-white shadow-[0_6px_24px_rgba(255,79,163,0.45)] transition hover:shadow-[0_8px_32px_rgba(255,79,163,0.65)] hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {laedt ? "Bitte warten …" : buttonText}
          </button>
        </form>

        {/* Wechsel zwischen Anmelden und Registrieren */}
        {methode === "passwort" && !linkBestaetigen && (
          <p className="mt-6 text-center text-sm text-sky-900/70">
            {modus === "anmelden" ? "Noch kein Konto?" : "Schon registriert?"}{" "}
            <button
              type="button"
              onClick={() => {
                setModus(modus === "anmelden" ? "registrieren" : "anmelden");
                setFehler("");
                setInfo("");
              }}
              className="font-semibold text-[#ff4fa3] hover:underline"
            >
              {modus === "anmelden" ? "Jetzt registrieren" : "Zur Anmeldung"}
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
