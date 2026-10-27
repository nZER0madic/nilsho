"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  // Aktueller Inhalt des Eingabefelds
  const [eingabe, setEingabe] = useState("");
  // Alle bisherigen Eingaben als Liste (Array von Texten)
  const [verlauf, setVerlauf] = useState<string[]>([]);

  // Eingabe an den Verlauf anhängen
  function handleSenden() {
    const wert = eingabe.trim();
    if (wert === "") return;
    // Neues Array aus bisherigem Verlauf (...verlauf) plus neuem Wert.
    // State wird nie direkt verändert, sondern immer neu gesetzt.
    setVerlauf([...verlauf, wert]);
    // Feld nach dem Senden leeren
    setEingabe("");
  }

  // Löscht den gesamten Verlauf
  function handleVerlaufLoeschen() {
    setVerlauf([]);
  }

  // Leert nur das Eingabefeld
  function handleFeldLeeren() {
    setEingabe("");
  }

  // Gemeinsame Klassen aller drei Buttons – vermeidet Wiederholung
  const buttonKlassen =
    "flex h-12 w-full items-center justify-center rounded-full border border-solid border-[#4169E1] px-5 transition-colors md:w-[158px]";

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <div className="flex w-full flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Gib etwas ein und drücke einen Button.
          </h1>

          {/* Chatverlauf: wird nur angezeigt, wenn mindestens ein Eintrag existiert */}
          {verlauf.length > 0 && (
            <div className="flex w-full max-w-md flex-col gap-2">
              {/* .map() erzeugt für jeden Eintrag ein eigenes Element.
                  key hilft React, die Einträge auseinanderzuhalten. */}
              {verlauf.map((nachricht, index) => (
                <div
                  key={index}
                  className="self-end rounded-2xl rounded-br-sm bg-[#4169E1] px-4 py-2 text-left text-base text-white"
                >
                  {nachricht}
                </div>
              ))}
            </div>
          )}

          <form
            className="flex w-full max-w-md flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSenden();
            }}
          >
            <input
              type="text"
              value={eingabe}
              onChange={(e) => setEingabe(e.target.value)}
              placeholder="Nachricht eingeben"
              className="h-12 w-full rounded-full border border-solid border-[#4169E1] bg-transparent px-5 text-base text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-[#27408B] dark:text-zinc-50"
            />

            <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
              {/* Button 1: sendet die Eingabe in den Verlauf */}
              <button
                type="submit"
                className={`${buttonKlassen} bg-[#4169E1] text-white hover:bg-[#27408B]`}
              >
                Senden
              </button>

              {/* Button 2: löscht den gesamten Verlauf */}
              <button
                type="button"
                onClick={handleVerlaufLoeschen}
                className={`${buttonKlassen} text-[#4169E1] hover:bg-[#4169E1]/10`}
              >
                Verlauf löschen
              </button>

              {/* Button 3: leert nur das Eingabefeld */}
              <button
                type="button"
                onClick={handleFeldLeeren}
                className={`${buttonKlassen} text-[#4169E1] hover:bg-[#4169E1]/10`}
              >
                Feld leeren
              </button>
            </div>
          </form>
        </div>

        {/* Statuszeile statt einzelner Textausgabe */}
        <p className="min-h-8 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {verlauf.length === 0
            ? "Noch keine Eingaben."
            : `${verlauf.length} Eingabe${verlauf.length === 1 ? "" : "n"} im Verlauf.`}
        </p>
      </main>
    </div>
  );
}
