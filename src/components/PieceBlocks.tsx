import { Fragment } from 'react';
import type { Pieces } from '@/lib/types';

export interface PieceItem {
  label: string;
  on: boolean;
}

// Bloquinhos encadeados: apagado até a peça correspondente estar no ar, ligados por um
// traço que acende quando as duas pontas estão acesas. Usado no cartão do participante
// (Site/API/Banco) e no cartão do hub (API/Banco).
export function PieceBlocks({ items }: { items: PieceItem[] }) {
  return (
    <span className="pieces">
      {items.map((item, index) => {
        const previous = items[index - 1];

        return (
          <Fragment key={item.label}>
            {previous && <span className={`link${item.on && previous.on ? ' on' : ''}`} />}
            <span className={`piece${item.on ? ' on' : ''}`}>{item.label}</span>
          </Fragment>
        );
      })}
    </span>
  );
}

export const participantPieces = (p: Pieces): PieceItem[] => [
  { label: 'Site', on: p.site },
  { label: 'API', on: p.api },
  { label: 'Banco', on: p.db },
];
