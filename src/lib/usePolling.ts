'use client';

import { useEffect, useState } from 'react';
import type { Result } from './http';

// Chama `load` agora e a cada `intervalMs`. Enquanto não houver resposta, `result` é null
// (a tela mostra o esqueleto); depois vira ok ou falha, e a próxima rodada tenta de novo.
export function usePolling<T>(load: () => Promise<Result<T>>, intervalMs: number) {
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const next = await load();
      if (active) setResult(next);
    };

    run();
    const timer = setInterval(run, intervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return result;
}
