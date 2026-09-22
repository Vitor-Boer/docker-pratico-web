'use client';

import Link from 'next/link';
import { use } from 'react';
import { participantPieces, PieceBlocks } from '@/components/PieceBlocks';
import { getParticipant } from '@/lib/api';
import { usePolling } from '@/lib/usePolling';

export default function ParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const result = usePolling(() => getParticipant(id), 3000);

  return (
    <div className="page">
      <div className="card">
        <Link href="/">← Voltar ao quadro</Link>

        {!result && <div className="row skeleton" aria-hidden="true" />}

        {result && !result.ok && (
          <p className="notice">
            {result.status === 404
              ? 'Participante não encontrado.'
              : 'Não foi possível carregar. A API local e o hub precisam estar no ar.'}
          </p>
        )}

        {result?.ok && (
          <>
            <h2>{result.data.name}</h2>
            <PieceBlocks items={participantPieces(result.data)} />
          </>
        )}
      </div>
    </div>
  );
}
