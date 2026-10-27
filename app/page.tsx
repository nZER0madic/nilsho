// Markiert diese Datei als Client Component: Der Code läuft (auch) im Browser.
// Nötig, weil useState und onClick/onChange im Server-Rendering nicht funktionieren.
"use client";

// Die Bild-Komponente von Next.js – optimiert Größe, Format und Ladeverhalten automatisch.
import Image from "next/image";
// useState ist ein React-Hook: Er speichert Werte, die sich während der Nutzung ändern.
import { useState } from "react";

// Die Standard-Exportfunktion einer page.tsx ist die Seite selbst (hier die Route "/").
export default function Home() {
  // Zustand 1: der aktuelle Inhalt des Eingabefelds. Startwert ist ein leerer Text.
  // "eingabe" = aktueller Wert, "setEingabe" = Funktion zum Ändern.
  const [eingabe, setEingabe] = useState("");
  // Zustand 2: der Text, der unten ausgegeben wird.
  const [ausgabe, setAusgabe] = useState("");

  // Wird beim Absenden des Formulars aufgerufen.
  function handleAnzeigen() {
    // .trim() entfernt Leerzeichen am Anfang und Ende.
    const wert = eingabe.trim();
    // Leere Eingabe: Hinweis setzen und die Funktion mit "return" sofort beenden.
    if (wert === "") {
      setAusgabe("Bitte zuerst etwas eingeben.");
      return;
    }
    // Template-String (Backticks): ${wert} setzt den Eingabewert in den Text ein.
    setAusgabe(`Hallo, ${wert}!`);
  }

  // Setzt beide Zustände zurück auf den Ausgangswert.
  function handleZuruecksetzen() {
    setEingabe("");
    setAusgabe("");
  }

  // Der return-Block beschreibt in JSX, was auf dem Bildschirm erscheint.
  return (
    // Äußerer Rahmen: füllt die Höhe, zentriert den Inhalt, setzt die Hintergrundfarbe.
    // "dark:" greift nur, wenn das System auf dunklen Modus eingestellt ist.
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* Inhaltsspalte: begrenzte Breite (max-w-3xl), Innenabstand, Elemente vertikal
          auseinandergezogen (justify-between). "sm:" gilt ab kleiner Bildschirmbreite. */}
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {/* Logo aus dem public-Ordner. "priority" lädt es bevorzugt, da es oben sichtbar ist.
            width/height verhindern ein Springen des Layouts beim Laden. */}
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        {/* Mittlerer Bereich: Überschrift und Formular, mit gap-6 Abstand dazwischen. */}
        <div className="flex w-full flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Gib etwas ein und drücke einen Button.
          </h1>

          {/* Das <form> sorgt dafür, dass auch die Enter-Taste die Eingabe absendet. */}
          <form
            className="flex w-full max-w-md flex-col gap-4"
            onSubmit={(e) => {
              // Verhindert das Standardverhalten des Browsers (Seite neu laden).
              e.preventDefault();
              handleAnzeigen();
            }}
          >
            {/* "Controlled Input": value kommt aus dem State, onChange schreibt zurück.
                Dadurch sind Feldinhalt und State immer identisch. */}
            <input
              type="text"
              value={eingabe}
              onChange={(e) => setEingabe(e.target.value)}
              placeholder="Name eingeben"
              className="h-12 w-full rounded-full border border-solid border-black/[.08] bg-transparent px-5 text-base text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-black/[.3] dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/[.4]"
            />

            {/* Button-Reihe: untereinander auf kleinen, nebeneinander ab sm-Breite. */}
            <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
              {/* type="submit" löst das onSubmit des Formulars aus – kein eigenes onClick nötig. */}
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
              >
                Anzeigen
              </button>
              {/* type="button" verhindert, dass dieser Button das Formular absendet.
                  onClick={handleZuruecksetzen} ohne Klammern: Die Funktion wird übergeben,
                  nicht sofort ausgeführt. */}
              <button
                type="button"
                onClick={handleZuruecksetzen}
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              >
                Zurücksetzen
              </button>
            </div>
          </form>
        </div>

        {/* Textausgabe. min-h-8 hält die Höhe frei, damit das Layout nicht springt.
            "ausgabe || ..." zeigt den Ersatztext, solange ausgabe leer ist. */}
        <p className="min-h-8 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {ausgabe || "Noch nichts eingegeben."}
        </p>
      </main>
    </div>
  );
}
