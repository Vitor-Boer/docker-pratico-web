'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { getParticipants } from '@/lib/hub';
import { usePolling } from '@/lib/usePolling';
import { checkpointLabel } from './checkpointLabel';
import { useSiteStatus } from './StatusProvider';

const CARD_W = 200;
const CARD_H = 84;
const GAP = 36;
const MIN_SCALE = 0.3;
const MAX_SCALE = 2;
const DRAG_THRESHOLD = 4;

interface Pos {
  x: number;
  y: number;
}

type Drag =
  | { kind: 'pan'; sx: number; sy: number; vx: number; vy: number }
  | { kind: 'card'; id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean };

const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

// n-ésima célula de uma espiral quadrada a partir do centro: (0,0), (1,0), (1,1), (0,1), (-1,1)...
// Cada participante novo ocupa a próxima célula livre, então os cartões nunca se sobrepõem
// e os que já estão no quadro não se mexem quando alguém chega.
function spiralCell(n: number): Pos {
  let x = 0;
  let y = 0;
  let dx = 1;
  let dy = 0;
  let segment = 1;
  let passed = 0;
  let turns = 0;

  for (let i = 0; i < n; i++) {
    x += dx;
    y += dy;
    passed++;
    if (passed === segment) {
      passed = 0;
      [dx, dy] = [-dy, dx];
      turns++;
      if (turns % 2 === 0) segment++;
    }
  }
  return { x, y };
}

// Desvio pequeno e estável (a partir do id) para o quadro parecer orgânico, não uma grade.
function jitter(id: string): Pos {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return { x: (hash % 21) - 10, y: ((hash >> 8) % 21) - 10 };
}

// Quadro em branco: os participantes aparecem como cartões conforme entram no hub.
// Arraste o fundo para mover, use a roda do mouse (ou os botões) para o zoom,
// arraste um cartão para reposicioná-lo e clique nele para ver o participante.
export function Board() {
  const router = useRouter();
  const status = useSiteStatus();
  const result = usePolling(getParticipants, 3000);

  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const placed = useRef<Record<string, Pos>>({});
  const nextCell = useRef(0);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [, redraw] = useState(0);

  const participants = result?.ok ? result.data : [];

  // A origem do quadro começa no centro da tela.
  useEffect(() => {
    const el = viewportRef.current;
    if (el) setView((v) => ({ ...v, x: el.clientWidth / 2, y: el.clientHeight / 2 }));
  }, []);

  // Quem chegou agora ganha a próxima célula livre.
  useEffect(() => {
    if (!result?.ok) return;

    let changed = false;
    for (const p of result.data) {
      if (placed.current[p.id]) continue;
      const cell = spiralCell(nextCell.current++);
      const offset = jitter(p.id);
      placed.current[p.id] = {
        x: cell.x * (CARD_W + GAP) - CARD_W / 2 + offset.x,
        y: cell.y * (CARD_H + GAP) - CARD_H / 2 + offset.y,
      };
      changed = true;
    }
    if (changed) redraw((n) => n + 1);
  }, [result]);

  // Precisa ser listener nativo não passivo para poder impedir a rolagem da página.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, event.deltaY < 0 ? 1.1 : 1 / 1.1);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function zoomAt(cx: number, cy: number, factor: number) {
    setView((v) => {
      const scale = clampScale(v.scale * factor);
      const k = scale / v.scale;
      return { scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }

  function zoomFromCenter(factor: number) {
    const el = viewportRef.current;
    if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, factor);
  }

  function resetView() {
    const el = viewportRef.current;
    if (el) setView({ scale: 1, x: el.clientWidth / 2, y: el.clientHeight / 2 });
  }

  function onBackgroundDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    drag.current = { kind: 'pan', sx: event.clientX, sy: event.clientY, vx: view.x, vy: view.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onCardDown(event: PointerEvent<HTMLDivElement>, id: string) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const pos = placed.current[id];
    drag.current = { kind: 'card', id, sx: event.clientX, sy: event.clientY, ox: pos.x, oy: pos.y, moved: false };
    viewportRef.current?.setPointerCapture(event.pointerId);
  }

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;

    const dx = event.clientX - d.sx;
    const dy = event.clientY - d.sy;

    if (d.kind === 'pan') {
      setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
      return;
    }

    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
    if (d.moved) {
      placed.current[d.id] = { x: d.ox + dx / view.scale, y: d.oy + dy / view.scale };
      redraw((n) => n + 1);
    }
  }

  function onUp() {
    const d = drag.current;
    drag.current = null;
    // Clique sem arrastar abre o participante.
    if (d?.kind === 'card' && !d.moved) router.push(`/participantes/${d.id}`);
  }

  let hint: string | null = null;
  if (result && participants.length === 0) {
    if (!result.ok) {
      hint =
        status.api === 'up'
          ? 'Hub indisponível no momento.'
          : 'Quadro em branco. Suba a API para os participantes começarem a aparecer aqui.';
    } else {
      hint = 'Ninguém conectou ainda.';
    }
  }

  const dot = 24 * view.scale;

  return (
    <div
      ref={viewportRef}
      className="board"
      style={{ backgroundSize: `${dot}px ${dot}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
      onPointerDown={onBackgroundDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        className="world"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        {participants.map((p) => {
          const pos = placed.current[p.id];
          if (!pos) return null;

          return (
            <div
              key={p.id}
              className={`board-card checkpoint-${p.checkpoint ?? 'NONE'}`}
              style={{ left: pos.x, top: pos.y, width: CARD_W, height: CARD_H }}
              onPointerDown={(event) => onCardDown(event, p.id)}
              role="link"
              tabIndex={0}
              onKeyDown={(event) => event.key === 'Enter' && router.push(`/participantes/${p.id}`)}
            >
              <span className="name">{p.name}</span>
              <span className="tag">{checkpointLabel(p.checkpoint)}</span>
            </div>
          );
        })}
      </div>

      {hint && <p className="board-hint">{hint}</p>}

      <div className="zoom" onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" className="secondary" onClick={() => zoomFromCenter(1.2)} aria-label="Aproximar">
          +
        </button>
        <button type="button" className="secondary" onClick={() => zoomFromCenter(1 / 1.2)} aria-label="Afastar">
          −
        </button>
        <button type="button" className="secondary" onClick={resetView}>
          Centralizar
        </button>
      </div>
    </div>
  );
}
