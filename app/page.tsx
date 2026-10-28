"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const GEHEIMWORT = "secret flappy";

export default function Home() {
  const [eingabe, setEingabe] = useState("");
  const [verlauf, setVerlauf] = useState<string[]>([]);
  const [spielAktiv, setSpielAktiv] = useState(false);
  const [hinweis, setHinweis] = useState("");

  function handleSenden() {
    const wert = eingabe.trim();
    if (wert === "") return;

    if (wert.toLowerCase() === GEHEIMWORT) {
      setEingabe("");
      setHinweis("Geheimwort erkannt.");
      setSpielAktiv(true);
      return;
    }

    setVerlauf([...verlauf, wert]);
    setEingabe("");
    setHinweis("");
  }

  function handleVerlaufLoeschen() {
    setVerlauf([]);
    setHinweis("");
  }

  function handleFeldLeeren() {
    setEingabe("");
  }

  const buttonKlassen =
    "flex h-12 w-full items-center justify-center rounded-full border border-solid border-[#4169E1] px-5 transition-colors md:w-[158px]";

  if (spielAktiv) {
    return (
      <Flattervogel
        onBeenden={() => {
          setSpielAktiv(false);
          setHinweis("");
        }}
      />
    );
  }

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

          {verlauf.length > 0 && (
            <div className="flex w-full max-w-md flex-col gap-2">
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
              <button
                type="submit"
                className={`${buttonKlassen} bg-[#4169E1] text-white hover:bg-[#27408B]`}
              >
                Senden
              </button>
              <button
                type="button"
                onClick={handleVerlaufLoeschen}
                className={`${buttonKlassen} text-[#4169E1] hover:bg-[#4169E1]/10`}
              >
                Verlauf löschen
              </button>
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

        <p className="min-h-8 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {hinweis ||
            (verlauf.length === 0
              ? "Noch keine Eingaben."
              : `${verlauf.length} Eingabe${verlauf.length === 1 ? "" : "n"} im Verlauf.`)}
        </p>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spiel
// ---------------------------------------------------------------------------

// ---- Simulationstakt ----
// Alle Physikwerte unten sind "pro Schritt" definiert und wurden bei 360
// Bildern pro Sekunde eingestellt. Die Simulation läuft daher fest mit 360
// Schritten pro Sekunde, unabhängig von der Bildrate des Geräts. Bei 360 Hz
// ist das ein Schritt pro Bild, bei 60 Hz sechs, bei 30 Hz zwölf.
const SIM_HZ = 360;
const STEP = 1000 / SIM_HZ;   // Dauer eines Schritts in Millisekunden
const MAX_STEPS = 32;         // Obergrenze pro Bild, schützt schwache Geräte

const WIDTH = 500;
const HEIGHT = 700;
const GROUND = 96;        // Bodenstreifen inkl. Grasnarbe

// ---- Flugverhalten: unverändert übernommen ----
const GRAVITY = 0.018;
const JUMP = -2.3;
const MAX_FALL = 7.5;

const BIRD_X = 90;
const BIRD_R = 15;
const PIPE_W = 62;
const CAP_W = PIPE_W + 10; // Kappe ragt links und rechts heraus
const CAP_H = 26;
const PIPE_GAP = 200;
const PIPE_SPEED = 1.0;
const PIPE_DIST = 400;

// ---- Animationstempi, aus den alten Frame-Zählern umgerechnet ----
// Alt: Math.floor(frame / 6) % 4  bei 360 fps  ->  60 Phasen pro Sekunde
const FLUEGEL_HZ = 60;
// Alt: Math.sin(frame * 0.08)     bei 360 fps  ->  28,8 Radiant pro Sekunde
const SCHWEBE_TEMPO = 0.08 * SIM_HZ;

// ---- Farbpalette im Stil des Originals ----
const C = {
  himmel: "#4ec0ca",
  himmelUnten: "#8ad4dc",
  wolke: "#ffffff",
  busch: "#5ee270",
  buschDunkel: "#3fa85a",
  haus: "#dedede",
  roehre: "#74bf2e",
  roehreHell: "#b7e76a",
  roehreDunkel: "#508a1e",
  umriss: "#3b2d1a",
  gras: "#5ee270",
  grasDunkel: "#3fa85a",
  boden: "#ded895",
  bodenDunkel: "#c9c072",
  vogel: "#f7d51d",
  vogelDunkel: "#e0a81c",
  bauch: "#fdfcd3",
  schnabel: "#f8913a",
  schnabelDunkel: "#dd6f1f",
};

type Status = "ready" | "running" | "over";
type Pipe = { x: number; gapY: number; passed: boolean };

// Kleiner Helfer: abgerundetes Rechteck als Pfad (für ältere Browser ohne roundRect)
function pfadRund(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function Flattervogel({ onBeenden }: { onBeenden: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<Status>("ready");
  const statusRef = useRef<Status>("ready");
  const setGameStatus = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [best, setBest] = useState(0);

  const bird = useRef({ y: HEIGHT / 2, v: 0 });
  const pipes = useRef<Pipe[]>([]);
  const groundX = useRef(0);
  const bgX = useRef(0);

  // Simulationszeit in Sekunden – Grundlage aller Animationen.
  // Ersetzt den alten Frame-Zähler, damit Flügelschlag und Schweben
  // auf jedem Gerät gleich schnell laufen.
  const simZeit = useRef(0);

  const reset = useCallback(() => {
    bird.current = { y: HEIGHT / 2, v: 0 };
    pipes.current = [];
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const flap = useCallback(() => {
    if (statusRef.current === "ready") {
      reset();
      setGameStatus("running");
      bird.current.v = JUMP;
    } else if (statusRef.current === "running") {
      bird.current.v = JUMP;
    } else {
      reset();
      setGameStatus("ready");
    }
  }, [reset, setGameStatus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
      if (e.code === "Escape") onBeenden();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap, onBeenden]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;

    // Scharfe Darstellung auf hochauflösenden Bildschirmen:
    // Die Pixelfläche wird mit dem Gerätefaktor multipliziert, gezeichnet
    // wird aber weiter im 500x700-Koordinatensystem.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(WIDTH * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Himmelsverlauf einmalig anlegen statt in jedem Bild neu
    const himmelVerlauf = ctx.createLinearGradient(0, 0, 0, HEIGHT - GROUND);
    himmelVerlauf.addColorStop(0, C.himmel);
    himmelVerlauf.addColorStop(1, C.himmelUnten);

    const gameOver = () => {
      setGameStatus("over");
      setBest((b) => Math.max(b, scoreRef.current));
    };

    // ---------------- Logik: genau ein Simulationsschritt ----------------
    const update = () => {
      const b = bird.current;

      b.v = Math.min(b.v + GRAVITY, MAX_FALL);
      b.y += b.v;

      pipes.current.forEach((p) => (p.x -= PIPE_SPEED));
      pipes.current = pipes.current.filter((p) => p.x > -CAP_W);

      const last = pipes.current[pipes.current.length - 1];
      if (!last || WIDTH - last.x >= PIPE_DIST) {
        const min = 70;
        const max = HEIGHT - GROUND - PIPE_GAP - 70;
        pipes.current.push({
          x: WIDTH,
          gapY: min + Math.random() * (max - min),
          passed: false,
        });
      }

      pipes.current.forEach((p) => {
        if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
          p.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      });

      if (b.y + BIRD_R >= HEIGHT - GROUND || b.y - BIRD_R <= 0) {
        gameOver();
        return;
      }

      for (const p of pipes.current) {
        // Die Kappe ist breiter als der Körper – sie bestimmt die Trefferzone
        const imBereich =
          BIRD_X + BIRD_R - 3 > p.x - 5 && BIRD_X - BIRD_R + 3 < p.x + PIPE_W + 5;
        const danebenGetroffen =
          b.y - BIRD_R + 3 < p.gapY || b.y + BIRD_R - 3 > p.gapY + PIPE_GAP;
        if (imBereich && danebenGetroffen) {
          gameOver();
          return;
        }
      }
    };

    // ---------------- Grafik ----------------

    const zeichneHimmel = () => {
      ctx.fillStyle = himmelVerlauf;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    };

    // Eine Wolke aus drei überlappenden Kreisen
    const zeichneWolke = (x: number, y: number, s: number) => {
      ctx.fillStyle = C.wolke;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(x, y, 14 * s, 0, Math.PI * 2);
      ctx.arc(x + 16 * s, y - 6 * s, 18 * s, 0, Math.PI * 2);
      ctx.arc(x + 34 * s, y, 13 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 14 * s, y, 48 * s, 14 * s);
      ctx.globalAlpha = 1;
    };

    // Hintergrundebene: Wolken, Häuserzeile, Büschereihe – scrollt langsamer
    const zeichneHintergrund = () => {
      const o = bgX.current;
      zeichneWolke(((40 - o * 0.5) % (WIDTH + 120)) + 60, 90, 1);
      zeichneWolke(((230 - o * 0.5) % (WIDTH + 120)) + 60, 150, 0.75);
      zeichneWolke(((420 - o * 0.5) % (WIDTH + 120)) + 60, 60, 0.9);

      // Angedeutete Skyline
      const basis = HEIGHT - GROUND - 36;
      ctx.fillStyle = C.haus;
      ctx.globalAlpha = 0.55;
      for (let i = -1; i < 9; i++) {
        const x = ((i * 70 - o * 0.75) % (WIDTH + 140)) + 70;
        const h = 26 + ((i + 5) % 3) * 12;
        ctx.fillRect(x, basis - h, 46, h);
      }
      ctx.globalAlpha = 1;

      // Büschereihe direkt über dem Boden
      const by = HEIGHT - GROUND - 18;
      for (let i = -1; i < 12; i++) {
        const x = ((i * 48 - o) % (WIDTH + 96)) + 48;
        ctx.fillStyle = C.buschDunkel;
        ctx.beginPath();
        ctx.arc(x, by + 6, 20, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = C.busch;
        ctx.beginPath();
        ctx.arc(x, by + 10, 16, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = C.busch;
      ctx.fillRect(0, by + 10, WIDTH, 14);
    };

    // Ein Röhrensegment: Körper mit Glanzlicht plus Kappe am Ende
    const zeichneRoehre = (
      x: number,
      y: number,
      h: number,
      kappeOben: boolean
    ) => {
      if (h <= 0) return;

      // Körper
      ctx.fillStyle = C.roehre;
      ctx.fillRect(x, y, PIPE_W, h);
      ctx.fillStyle = C.roehreHell;
      ctx.fillRect(x + 7, y, 11, h);
      ctx.fillStyle = C.roehreDunkel;
      ctx.fillRect(x + PIPE_W - 14, y, 10, h);
      ctx.strokeStyle = C.umriss;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y - 1, PIPE_W - 2, h + 2);

      // Kappe
      const cx = x - 5;
      const cy = kappeOben ? y + h - CAP_H : y;
      ctx.fillStyle = C.roehre;
      ctx.fillRect(cx, cy, CAP_W, CAP_H);
      ctx.fillStyle = C.roehreHell;
      ctx.fillRect(cx + 7, cy + 2, 11, CAP_H - 4);
      ctx.fillStyle = C.roehreDunkel;
      ctx.fillRect(cx + CAP_W - 15, cy + 2, 11, CAP_H - 4);
      ctx.strokeStyle = C.umriss;
      ctx.strokeRect(cx + 1, cy + 1, CAP_W - 2, CAP_H - 2);
    };

    // Boden: Grasnarbe mit Zickzackkante und gestreifte Erde, beides scrollend
    const zeichneBoden = () => {
      const top = HEIGHT - GROUND;
      const o = groundX.current;

      ctx.fillStyle = C.gras;
      ctx.fillRect(0, top, WIDTH, 22);
      ctx.fillStyle = C.grasDunkel;
      for (let i = -1; i < WIDTH / 12 + 2; i++) {
        const x = i * 12 - (o % 12);
        ctx.beginPath();
        ctx.moveTo(x, top + 22);
        ctx.lineTo(x + 6, top + 14);
        ctx.lineTo(x + 12, top + 22);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = C.boden;
      ctx.fillRect(0, top + 22, WIDTH, GROUND - 22);
      ctx.fillStyle = C.bodenDunkel;
      for (let i = -2; i < WIDTH / 24 + 3; i++) {
        const x = i * 24 - (o % 24);
        ctx.beginPath();
        ctx.moveTo(x, top + 22);
        ctx.lineTo(x + 12, top + 22);
        ctx.lineTo(x + 2, HEIGHT);
        ctx.lineTo(x - 10, HEIGHT);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = C.umriss;
      ctx.fillRect(0, top, WIDTH, 2);
    };

    // Vogel: Körper, Bauch, Flügel (dreistufiger Schlag), Auge, Schnabel
    const zeichneVogel = () => {
      const b = bird.current;
      // Neigung hängt nur von der Geschwindigkeit ab – Formel unverändert
      const winkel = Math.max(-0.4, Math.min(1.25, b.v / 9));
      // Flügelphase jetzt zeitbasiert statt über den Frame-Zähler
      const phase = Math.floor(simZeit.current * FLUEGEL_HZ) % 4;
      const fluegel = b.v > 2 ? 2 : [0, -4, 0, 4][phase];

      ctx.save();
      ctx.translate(BIRD_X, b.y);
      ctx.rotate(winkel);
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.umriss;

      // Körper
      ctx.fillStyle = C.vogel;
      pfadRund(ctx, -BIRD_R, -BIRD_R + 2, BIRD_R * 2, BIRD_R * 2 - 5, 9);
      ctx.fill();
      ctx.stroke();

      // Schattierung unten
      ctx.fillStyle = C.vogelDunkel;
      pfadRund(ctx, -BIRD_R + 2, BIRD_R - 8, BIRD_R * 2 - 4, 7, 4);
      ctx.fill();

      // Heller Bauch
      ctx.fillStyle = C.bauch;
      pfadRund(ctx, -2, 1, 15, 9, 4);
      ctx.fill();
      ctx.stroke();

      // Flügel
      ctx.fillStyle = "#ffffff";
      pfadRund(ctx, -13, -3 + fluegel, 14, 10, 5);
      ctx.fill();
      ctx.stroke();

      // Auge
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(7, -6, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.umriss;
      ctx.fillRect(7, -9, 4, 7);

      // Schnabel
      ctx.fillStyle = C.schnabel;
      pfadRund(ctx, 9, 0, 14, 8, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.schnabelDunkel;
      ctx.fillRect(11, 5, 10, 2);

      ctx.restore();
    };

    const draw = () => {
      zeichneHimmel();
      zeichneHintergrund();
      pipes.current.forEach((p) => {
        zeichneRoehre(p.x, 0, p.gapY, true);
        zeichneRoehre(
          p.x,
          p.gapY + PIPE_GAP,
          HEIGHT - GROUND - p.gapY - PIPE_GAP,
          false
        );
      });
      zeichneBoden();
      zeichneVogel();
    };

    // ---------------- Ein Simulationsschritt ----------------
    const tick = () => {
      simZeit.current += 1 / SIM_HZ;

      if (statusRef.current === "running") {
        update();
        groundX.current += PIPE_SPEED;
        bgX.current += PIPE_SPEED * 0.4;
      } else if (statusRef.current === "ready") {
        // Im Startzustand schwebt der Vogel sanft auf und ab
        bird.current.y =
          HEIGHT / 2 + Math.sin(simZeit.current * SCHWEBE_TEMPO) * 8;
        bird.current.v = 0;
        groundX.current += PIPE_SPEED;
        bgX.current += PIPE_SPEED * 0.4;
      }
    };

    // ---------------- Hauptschleife ----------------
    let letzteZeit = performance.now();
    let akku = 0;   // angesammelte, noch nicht verrechnete Zeit

    const loop = (jetzt: number) => {
      let delta = jetzt - letzteZeit;
      letzteZeit = jetzt;

      // Nach einem Tab-Wechsel oder einem Haltepunkt im Debugger wäre delta
      // sehr groß. Dann lieber einen Schritt rechnen als tausende.
      if (delta > 250) delta = STEP;

      akku += delta;

      // So viele Schritte wie Zeit vergangen ist, höchstens MAX_STEPS
      let schritte = 0;
      while (akku >= STEP && schritte < MAX_STEPS) {
        tick();
        akku -= STEP;
        schritte += 1;
      }
      // Kommt das Gerät nicht mit, wird der Rest verworfen statt aufgestaut
      if (schritte === MAX_STEPS) akku = 0;

      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [setGameStatus]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Flattervogel
        </h1>

        <div
          onPointerDown={flap}
          className="relative cursor-pointer select-none overflow-hidden rounded-2xl border border-solid border-[#4169E1] touch-none"
          style={{ width: WIDTH, height: HEIGHT }}
        >
          {/* Die Pixelgröße setzt der Effekt anhand des Gerätefaktors.
              Hier wird nur die Anzeigegröße festgelegt. */}
          <canvas
            ref={canvasRef}
            style={{ width: WIDTH, height: HEIGHT, display: "block" }}
          />

          <div
            className="pointer-events-none absolute left-0 top-6 w-full text-center text-5xl font-extrabold text-white"
            style={{ WebkitTextStroke: "3px #3b2d1a" }}
          >
            {score}
          </div>

          {status === "ready" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end gap-2 pb-40 text-center text-white">
              <p
                className="text-3xl font-extrabold"
                style={{ WebkitTextStroke: "2px #3b2d1a" }}
              >
                Bereit?
              </p>
              <p className="rounded-full bg-black/40 px-4 py-1 text-sm">
                Klicken oder Leertaste zum Flattern
              </p>
            </div>
          )}

          {status === "over" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl border-2 border-[#3b2d1a] bg-[#ded895] px-8 py-6 text-center text-[#3b2d1a] shadow-lg">
                <p className="text-2xl font-extrabold">Vorbei</p>
                <p className="mt-2 text-lg">Punkte: {score}</p>
                <p className="text-lg">Bestleistung: {best}</p>
                <p className="mt-3 text-sm">Klicken für einen neuen Versuch</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <button
            type="button"
            onClick={flap}
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-[#4169E1] bg-[#4169E1] px-5 text-white transition-colors hover:bg-[#27408B] md:w-[158px]"
          >
            {status === "running" ? "Flattern" : "Start"}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setGameStatus("ready");
            }}
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-[#4169E1] px-5 text-[#4169E1] transition-colors hover:bg-[#4169E1]/10 md:w-[158px]"
          >
            Neues Spiel
          </button>
          <button
            type="button"
            onClick={onBeenden}
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-[#4169E1] px-5 text-[#4169E1] transition-colors hover:bg-[#4169E1]/10 md:w-[158px]"
          >
            Zurück
          </button>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400">Bestleistung: {best}</p>
      </main>
    </div>
  );
}
