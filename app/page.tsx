"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const GEHEIMWORT = "allahu akbar";

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
      <SkylineDash
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
// Deine Werte wurden bei 360 Bildern pro Sekunde eingestellt. Damit sie
// unverändert gültig bleiben, rechnet die Simulation intern weiterhin
// 360 Schritte pro Sekunde – unabhängig davon, wie oft gezeichnet wird.
const SIM_HZ = 360;
const STEP = 1000 / SIM_HZ;   // Dauer eines Schritts in Millisekunden
const MAX_STEPS = 32;         // Obergrenze pro Frame (reicht bis ca. 11 fps)

const WIDTH = 500;
const HEIGHT = 700;
const GROUND = 96;

// ---- Deine Physik, unverändert (Einheiten: pro Simulationsschritt) ----
const GRAVITY = 0.02; //default 0.02
const JUMP = -2.5; //default -2.5
const MAX_FALL = 7.5; //default 7.5

const PLANE_X = 90; //default 90
const PLANE_R = 15; //default 15 - Trefferradius (das Flugzeug ist breiter als hoch)
const TOWER_W = 70; //default 70
const TOWER_GAP = 200; //default 200
const TOWER_SPEED = 1.0; //default 1.0
const TOWER_DIST = 400; //default 400

// ---- Explosion, ebenfalls auf den Simulationstakt bezogen ----
const EXPL_ANZAHL = 34;
const EXPL_GRAVITY = 0.14 / 36;      // Schwerkraft der Funken pro Schritt
const EXPL_DRAG = Math.pow(0.97, 1 / 6);   // Luftwiderstand pro Schritt
const EXPL_SHRINK = Math.pow(0.975, 1 / 6); // Schrumpfen pro Schritt
const EXPL_LEBEN_MIN = 26 * 6;       // Lebensdauer in Schritten
const EXPL_LEBEN_SPAN = 22 * 6;
const EXPL_MAX_LEBEN = 48 * 6;
const EXPL_BLITZ = 5 * 6;            // Dauer des weißen Blitzes
const EXPL_RING = 24 * 6;            // Dauer der Druckwelle
const EXPL_BALL = 16 * 6;            // Dauer des Feuerballs

const C = {
  himmel: "#5bb7d6",
  himmelUnten: "#a8dcea",
  wolke: "#ffffff",
  turm: "#7b8a9e",
  turmHell: "#9aa9bd",
  turmDunkel: "#566273",
  dach: "#4a5666",
  fenster: "#2e3a4a",
  fensterHell: "#ffd86b",
  umriss: "#2b3340",
  strasse: "#4a4f57",
  strasseHell: "#5c626b",
  markierung: "#e8e2b8",
  rumpf: "#f2f4f8",
  rumpfSchatten: "#c9d0db",
  streifen: "#d6453d",
  fluegel: "#dfe4ec",
  cockpit: "#2e3a4a",
};

type Status = "ready" | "running" | "over";
type Tower = { x: number; gapY: number; passed: boolean; seed: number };
type Funke = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  leben: number;
  maxLeben: number;
  farbe: string;
};

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

// Pseudozufall mit festem Startwert: beleuchtete Fenster bleiben pro Turm gleich
function fensterHell(seed: number, spalte: number, reihe: number) {
  const n =
    Math.sin(seed * 12.9898 + spalte * 78.233 + reihe * 37.719) * 43758.5453;
  return n - Math.floor(n) > 0.55;
}

function SkylineDash({ onBeenden }: { onBeenden: () => void }) {
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

  const plane = useRef({ y: HEIGHT / 2, v: 0 });
  const towers = useRef<Tower[]>([]);
  const groundX = useRef(0);
  const bgX = useRef(0);

  // Simulationszeit in Sekunden – Grundlage aller Animationen,
  // damit Propeller, Blinklicht und Schweben überall gleich schnell laufen.
  const simZeit = useRef(0);

  const funken = useRef<Funke[]>([]);
  const explosionSchritt = useRef(0);

  const reset = useCallback(() => {
    plane.current = { y: HEIGHT / 2, v: 0 };
    towers.current = [];
    funken.current = [];
    explosionSchritt.current = 0;
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const flap = useCallback(() => {
    if (statusRef.current === "ready") {
      reset();
      setGameStatus("running");
      plane.current.v = JUMP;
    } else if (statusRef.current === "running") {
      plane.current.v = JUMP;
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
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    // Himmelsverlauf nur einmal anlegen, nicht in jedem Bild neu
    const himmelVerlauf = ctx.createLinearGradient(0, 0, 0, HEIGHT - GROUND);
    himmelVerlauf.addColorStop(0, C.himmel);
    himmelVerlauf.addColorStop(1, C.himmelUnten);

    const starteExplosion = (x: number, y: number) => {
      explosionSchritt.current = 0;
      const farben = ["#fff3b0", "#ffd166", "#f4842d", "#e2502a", "#8d8d8d"];
      for (let i = 0; i < EXPL_ANZAHL; i++) {
        const winkel = Math.random() * Math.PI * 2;
        // Startgeschwindigkeit ebenfalls auf den Simulationstakt umgerechnet
        const tempo = (1.2 + Math.random() * 4.2) / 6;
        funken.current.push({
          x,
          y,
          vx: Math.cos(winkel) * tempo,
          vy: Math.sin(winkel) * tempo,
          r: 2 + Math.random() * 4,
          leben: EXPL_LEBEN_MIN + Math.random() * EXPL_LEBEN_SPAN,
          maxLeben: EXPL_MAX_LEBEN,
          farbe: farben[Math.floor(Math.random() * farben.length)],
        });
      }
    };

    const gameOver = (x: number, y: number) => {
      starteExplosion(x, y);
      setGameStatus("over");
      setBest((b) => Math.max(b, scoreRef.current));
    };

    // ---------------- Logik: genau ein Simulationsschritt ----------------
    const update = () => {
      const p = plane.current;

      p.v = Math.min(p.v + GRAVITY, MAX_FALL);
      p.y += p.v;

      towers.current.forEach((t) => (t.x -= TOWER_SPEED));
      towers.current = towers.current.filter((t) => t.x > -TOWER_W - 20);

      const last = towers.current[towers.current.length - 1];
      if (!last || WIDTH - last.x >= TOWER_DIST) {
        const min = 80;
        const max = HEIGHT - GROUND - TOWER_GAP - 80;
        towers.current.push({
          x: WIDTH,
          gapY: min + Math.random() * (max - min),
          passed: false,
          seed: Math.random() * 100,
        });
      }

      towers.current.forEach((t) => {
        if (!t.passed && t.x + TOWER_W < PLANE_X - PLANE_R) {
          t.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      });

      if (p.y + 10 >= HEIGHT - GROUND || p.y - 10 <= 0) {
        gameOver(PLANE_X, p.y);
        return;
      }

      for (const t of towers.current) {
        const imBereich =
          PLANE_X + PLANE_R - 2 > t.x && PLANE_X - PLANE_R + 4 < t.x + TOWER_W;
        const danebenGetroffen =
          p.y - 10 < t.gapY || p.y + 10 > t.gapY + TOWER_GAP;
        if (imBereich && danebenGetroffen) {
          gameOver(Math.max(PLANE_X, t.x), p.y);
          return;
        }
      }
    };

    // ---------------- Grafik ----------------

    const zeichneHimmel = () => {
      ctx.fillStyle = himmelVerlauf;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    };

    const zeichneWolke = (x: number, y: number, s: number) => {
      ctx.fillStyle = C.wolke;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, 14 * s, 0, Math.PI * 2);
      ctx.arc(x + 16 * s, y - 6 * s, 18 * s, 0, Math.PI * 2);
      ctx.arc(x + 34 * s, y, 13 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 14 * s, y, 48 * s, 14 * s);
      ctx.globalAlpha = 1;
    };

    const zeichneHintergrund = () => {
      const o = bgX.current;
      zeichneWolke(((40 - o * 0.5) % (WIDTH + 120)) + 60, 95, 1);
      zeichneWolke(((240 - o * 0.5) % (WIDTH + 120)) + 60, 160, 0.75);
      zeichneWolke(((430 - o * 0.5) % (WIDTH + 120)) + 60, 55, 0.9);

      const basis = HEIGHT - GROUND;
      ctx.globalAlpha = 0.4;
      for (let i = -1; i < 11; i++) {
        const x = ((i * 58 - o * 0.8) % (WIDTH + 116)) + 58;
        const h = 60 + ((i + 7) % 4) * 32;
        ctx.fillStyle = C.turmDunkel;
        ctx.fillRect(x, basis - h, 44, h);
        ctx.fillStyle = C.turmHell;
        ctx.fillRect(x + 18, basis - h - 14, 8, 14);
      }
      ctx.globalAlpha = 1;
    };

    const zeichneHochhaus = (
      x: number,
      y: number,
      h: number,
      dachUnten: boolean,
      seed: number
    ) => {
      if (h <= 0) return;

      ctx.fillStyle = C.turm;
      ctx.fillRect(x, y, TOWER_W, h);
      ctx.fillStyle = C.turmHell;
      ctx.fillRect(x + 4, y, 9, h);
      ctx.fillStyle = C.turmDunkel;
      ctx.fillRect(x + TOWER_W - 12, y, 12, h);

      const spalten = 4;
      const sx = 11;
      const abstand = (TOWER_W - 2 * sx - spalten * 9) / (spalten - 1);
      const reihen = Math.floor((h - 34) / 17);
      for (let r = 0; r < reihen; r++) {
        const fy = dachUnten ? y + h - 34 - r * 17 : y + 24 + r * 17;
        for (let c = 0; c < spalten; c++) {
          ctx.fillStyle = fensterHell(seed, c, r) ? C.fensterHell : C.fenster;
          ctx.fillRect(x + sx + c * (9 + abstand), fy, 9, 11);
        }
      }

      const dy = dachUnten ? y + h - 16 : y;
      ctx.fillStyle = C.dach;
      ctx.fillRect(x - 6, dy, TOWER_W + 12, 16);
      ctx.fillStyle = C.turmHell;
      ctx.fillRect(x - 6, dy + (dachUnten ? 0 : 13), TOWER_W + 12, 3);

      // Blinklicht: zwei Zyklen pro Sekunde, zeitbasiert statt framebasiert
      if (Math.floor(simZeit.current * 2) % 2 === 0) {
        ctx.fillStyle = "#ff5a4d";
        ctx.beginPath();
        ctx.arc(x + TOWER_W / 2, dachUnten ? dy - 3 : dy + 19, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = C.umriss;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y - 1, TOWER_W - 2, h + 2);
    };

    const zeichneStrasse = () => {
      const top = HEIGHT - GROUND;
      const o = groundX.current;

      ctx.fillStyle = C.strasse;
      ctx.fillRect(0, top, WIDTH, GROUND);
      ctx.fillStyle = C.strasseHell;
      ctx.fillRect(0, top, WIDTH, 10);
      ctx.fillStyle = C.umriss;
      ctx.fillRect(0, top, WIDTH, 2);

      ctx.fillStyle = C.markierung;
      for (let i = -1; i < WIDTH / 44 + 2; i++) {
        ctx.fillRect(i * 44 - (o % 44), top + 42, 26, 5);
      }
    };

    const zeichneFlugzeug = () => {
      const p = plane.current;
      // Neigung aus der Geschwindigkeit. Der Teiler ist auf den
      // Simulationstakt bezogen: 11 bei 60 Hz entspricht hier 11/6.
      const winkel = Math.max(-0.35, Math.min(0.9, p.v / (11 / 6)));

      ctx.save();
      ctx.translate(PLANE_X, p.y);
      ctx.rotate(winkel);
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.umriss;

      ctx.fillStyle = C.streifen;
      ctx.beginPath();
      ctx.moveTo(-18, 2);
      ctx.lineTo(-24, -14);
      ctx.lineTo(-12, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.rumpf;
      pfadRund(ctx, -22, -8, 44, 16, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.rumpf;
      ctx.beginPath();
      ctx.moveTo(18, -7);
      ctx.quadraticCurveTo(30, 0, 18, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.streifen;
      ctx.fillRect(-16, -2, 30, 3);
      ctx.fillStyle = C.rumpfSchatten;
      pfadRund(ctx, -20, 3, 38, 4, 2);
      ctx.fill();

      ctx.fillStyle = C.fluegel;
      ctx.beginPath();
      ctx.moveTo(-4, 3);
      ctx.lineTo(10, 12);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.cockpit;
      pfadRund(ctx, 9, -6, 8, 6, 2);
      ctx.fill();

      // Propeller: 54 Radiant pro Sekunde, zeitbasiert
      ctx.strokeStyle = C.umriss;
      ctx.beginPath();
      const ph = simZeit.current * 54;
      ctx.moveTo(26 + Math.cos(ph) * 2, Math.sin(ph) * 11);
      ctx.lineTo(26 - Math.cos(ph) * 2, -Math.sin(ph) * 11);
      ctx.stroke();

      ctx.restore();
    };

    const zeichneExplosion = () => {
      const f = explosionSchritt.current;

      if (f < EXPL_BLITZ) {
        ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - f / EXPL_BLITZ)})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      if (f < EXPL_RING && funken.current.length > 0) {
        const q = funken.current[0];
        ctx.strokeStyle = `rgba(255,214,102,${1 - f / EXPL_RING})`;
        ctx.lineWidth = Math.max(1, 6 - (f / EXPL_RING) * 4);
        ctx.beginPath();
        ctx.arc(q.x, q.y, 10 + (f / EXPL_RING) * 82, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (f < EXPL_BALL && funken.current.length > 0) {
        const q = funken.current[0];
        const r = Math.max(1, 26 * (1 - f / EXPL_BALL));
        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
        g.addColorStop(0, "rgba(255,255,220,0.95)");
        g.addColorStop(0.5, "rgba(244,132,45,0.8)");
        g.addColorStop(1, "rgba(226,80,42,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      funken.current.forEach((k) => {
        ctx.globalAlpha = Math.max(0, k.leben / k.maxLeben);
        ctx.fillStyle = k.farbe;
        ctx.beginPath();
        ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      zeichneHimmel();
      zeichneHintergrund();
      towers.current.forEach((t) => {
        zeichneHochhaus(t.x, 0, t.gapY, true, t.seed);
        zeichneHochhaus(
          t.x,
          t.gapY + TOWER_GAP,
          HEIGHT - GROUND - t.gapY - TOWER_GAP,
          false,
          t.seed + 9
        );
      });
      zeichneStrasse();
      if (funken.current.length === 0) zeichneFlugzeug();
      else zeichneExplosion();
    };

    // ---------------- Ein Simulationsschritt ----------------
    const tick = () => {
      simZeit.current += 1 / SIM_HZ;

      if (statusRef.current === "running") {
        update();
        groundX.current += TOWER_SPEED;
        bgX.current += TOWER_SPEED * 0.4;
      } else if (statusRef.current === "ready") {
        // Schweben: 4,8 Radiant pro Sekunde, 8 Pixel Ausschlag
        plane.current.y =
          HEIGHT / 2 + Math.sin(simZeit.current * 4.8) * 8;
        plane.current.v = 0;
        groundX.current += TOWER_SPEED;
        bgX.current += TOWER_SPEED * 0.4;
      }

      if (funken.current.length > 0) {
        explosionSchritt.current += 1;
        funken.current.forEach((k) => {
          k.x += k.vx;
          k.y += k.vy;
          k.vy += EXPL_GRAVITY;
          k.vx *= EXPL_DRAG;
          k.r *= EXPL_SHRINK;
          k.leben -= 1;
        });
        funken.current = funken.current.filter((k) => k.leben > 0);
      }
    };

    // ---------------- Hauptschleife ----------------
    let letzteZeit = performance.now();
    let akku = 0;

    const loop = (jetzt: number) => {
      let delta = jetzt - letzteZeit;
      letzteZeit = jetzt;

      // Nach einem Tab-Wechsel oder Haltepunkt im Debugger wäre delta sehr
      // groß. Dann wird ein einzelner Schritt gerechnet statt tausender.
      if (delta > 250) delta = STEP;

      akku += delta;

      // So viele Schritte wie nötig, höchstens MAX_STEPS. Bei 360 Hz ist
      // das ein Schritt pro Bild, bei 60 Hz sechs, bei 30 Hz zwölf.
      let schritte = 0;
      while (akku >= STEP && schritte < MAX_STEPS) {
        tick();
        akku -= STEP;
        schritte += 1;
      }
      // Reste verwerfen, falls das Gerät nicht mitkommt
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
          Skyline Dash
        </h1>

        <div
          onPointerDown={flap}
          className="relative cursor-pointer select-none overflow-hidden rounded-2xl border border-solid border-[#4169E1] touch-none"
          style={{ width: WIDTH, height: HEIGHT }}
        >
          <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />

          <div
            className="pointer-events-none absolute left-0 top-6 w-full text-center text-5xl font-extrabold text-white"
            style={{ WebkitTextStroke: "3px #2b3340" }}
          >
            {score}
          </div>

          {status === "ready" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end gap-2 pb-40 text-center text-white">
              <p
                className="text-3xl font-extrabold"
                style={{ WebkitTextStroke: "2px #2b3340" }}
              >
                Bereit zum Start?
              </p>
              <p className="rounded-full bg-black/40 px-4 py-1 text-sm">
                Klicken oder Leertaste zum Steigen
              </p>
            </div>
          )}

          {status === "over" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl border-2 border-[#2b3340] bg-[#dfe4ec] px-8 py-6 text-center text-[#2b3340] shadow-lg">
                <p className="text-2xl font-extrabold">Flug beendet</p>
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
            {status === "running" ? "Steigen" : "Start"}
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
