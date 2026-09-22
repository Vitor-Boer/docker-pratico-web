import { Fragment } from 'react';
import type { Pieces } from '@/lib/types';

const ORDER: Array<{ key: keyof Pieces; label: string }> = [
  { key: 'site', label: 'Site' },
  { key: 'api', label: 'API' },
  { key: 'db', label: 'Banco' },
];

// Os três bloquinhos do desafio. Apagado = aquela peça não está no ar agora; o traço entre
// dois blocos acende quando os dois estão de pé, então a linha se completa conforme o
// participante sobe os containers.
export function PieceBlocks({ pieces }: { pieces: Pieces }) {
  return (
    <span className="pieces">
      {ORDER.map(({ key, label }, index) => {
        const previous = ORDER[index - 1];

        return (
          <Fragment key={key}>
            {previous && (
              <span className={`link${pieces[key] && pieces[previous.key] ? ' on' : ''}`} />
            )}
            <span className={`piece${pieces[key] ? ' on' : ''}`}>{label}</span>
          </Fragment>
        );
      })}
    </span>
  );
}
