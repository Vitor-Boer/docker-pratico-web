'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { getParticipants } from '@/lib/api';
import { participantId } from '@/lib/identity';
import type { ParticipantView } from '@/lib/types';
import { usePolling } from '@/lib/usePolling';
import { participantPieces, PieceBlocks } from './PieceBlocks';
import { useSiteStatus } from './StatusProvider';

const CARD_W = 210;
const CARD_H = 92;
const GAP = 36;
// Espaço entre o cartão do hub e "Você" — maior que o GAP entre participantes, pra não
// grudar os dois.
const HUB_GAP = 96;
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

// Dois cartões (mesmo tamanho) se sobrepõem?
const overlaps = (a: Pos, b: Pos) => Math.abs(a.x - b.x) < CARD_W && Math.abs(a.y - b.y) < CARD_H;

const center = (pos: Pos): Pos => ({ x: pos.x + CARD_W / 2, y: pos.y + CARD_H / 2 });

// Traço de `a` até `b` em forma de fuso: fino nas pontas e com 4px de largura no meio.
// Vai de centro a centro; como o SVG fica atrás dos cartões, só aparece o trecho entre eles.
function spindle(a: Pos, b: Pos): string {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = ((a.y - b.y) / len) * 2;
  const ny = ((b.x - a.x) / len) * 2;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  return `${a.x},${a.y} ${mx + nx},${my + ny} ${b.x},${b.y} ${mx - nx},${my - ny}`;
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

  // O id só existe no navegador (localStorage): lido depois de montar, não durante o SSR.
  const [selfId, setSelfId] = useState<string | null>(null);
  useEffect(() => setSelfId(participantId()), []);

  // O próprio cartão não depende de ninguém: vem do estado que o site já tem localmente,
  // não da lista do hub. Aparece mesmo com a API e o hub fora do ar.
  const self: ParticipantView | null = selfId
    ? { id: selfId, name: 'Você', site: true, api: status.api === 'up', db: status.db === 'up' }
    : null;

  const others = result?.ok ? result.data.filter((p) => p.id !== selfId) : [];
  const participants = self ? [self, ...others] : others;

  // O cartão do hub não é um participante: fica fixo logo acima de "Você", ligado por um
  // traço vertical. Some até "Você" ganhar posição (primeiro render).
  const selfPos = selfId ? placed.current[selfId] : undefined;
  const hubPos = selfPos ? { x: selfPos.x, y: selfPos.y - CARD_H - HUB_GAP } : null;

  // A origem do quadro começa no centro da tela.
  useEffect(() => {
    const el = viewportRef.current;
    if (el) setView((v) => ({ ...v, x: el.clientWidth / 2, y: el.clientHeight / 2 }));
  }, []);

  // Quem chegou agora ganha a próxima célula livre. "Você" chega primeiro, então fica no
  // centro (célula 0) e os outros espiralam ao redor dele. Células que cairiam em cima do
  // cartão do hub são puladas.
  useEffect(() => {
    let changed = false;
    for (const p of participants) {
      if (placed.current[p.id]) continue;
      const offset = jitter(p.id);
      const self = selfId ? placed.current[selfId] : undefined;
      const hub = self ? { x: self.x, y: self.y - CARD_H - HUB_GAP } : null;

      let pos: Pos;
      do {
        const cell = spiralCell(nextCell.current++);
        pos = {
          x: cell.x * (CARD_W + GAP) - CARD_W / 2 + offset.x,
          y: cell.y * (CARD_H + GAP) - CARD_H / 2 + offset.y,
        };
      } while (hub && overlaps(pos, hub));

      placed.current[p.id] = pos;
      changed = true;
    }
    if (changed) redraw((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, selfId]);

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

  const apiUp = status.api === 'up';

  // "Você" está sempre no quadro; a dica é só sobre os outros. Fica no canto, fixa na
  // tela (fora do `.world`), então não se mexe com pan/zoom nem some atrás de um cartão.
  let hint: string | null = null;
  if (others.length === 0) {
    if (!apiUp) {
      hint = 'Suba a API para os outros participantes começarem a aparecer aqui.';
    } else if (result && !result.ok) {
      hint = 'Hub indisponível no momento.';
    } else if (result?.ok) {
      hint = 'Mais ninguém conectou ainda.';
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
        {hubPos && (
          <svg className="connectors">
            {participants.map((p) => {
              const pos = placed.current[p.id];
              return pos && <polygon key={p.id} points={spindle(center(hubPos), center(pos))} />;
            })}
          </svg>
        )}

        {participants.map((p) => {
          const pos = placed.current[p.id];
          if (!pos) return null;

          return (
            <div
              key={p.id}
              className={`board-card pieces-${[p.site, p.api, p.db].filter(Boolean).length}`}
              style={{ left: pos.x, top: pos.y, width: CARD_W, height: CARD_H }}
              onPointerDown={(event) => onCardDown(event, p.id)}
              role="link"
              tabIndex={0}
              onKeyDown={(event) => event.key === 'Enter' && router.push(`/participantes/${p.id}`)}
            >
              <span className="name">{p.name}</span>
              <PieceBlocks items={participantPieces(p)} />
            </div>
          );
        })}

        {hubPos && (
          <div className="board-card hub-card" style={{ left: hubPos.x, top: hubPos.y, width: CARD_W, height: CARD_H }}>
            <span className="name">Hub</span>
            <PieceBlocks
              items={[
                { label: 'API', on: status.hub === 'up' },
                { label: 'Banco', on: status.hub === 'up' },
              ]}
            />
          </div>
        )}
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
