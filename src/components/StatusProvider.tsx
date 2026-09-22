'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getProfile, getStatus } from '@/lib/api';
import { ping } from '@/lib/hub';

export type Light = 'checking' | 'up' | 'down';

export interface SiteStatus {
  api: Light;
  db: Light;
  hub: Light;
}

const CHECKING: SiteStatus = { api: 'checking', db: 'checking', hub: 'checking' };
const StatusContext = createContext<SiteStatus>(CHECKING);

export const useSiteStatus = () => useContext(StatusContext);

// Intervalo curto de propósito: o hub apaga quem não pinga há 30 s, então dá para perder
// cinco pings seguidos antes de sumir do painel. Isso cobre o navegador estrangulando os
// timers de uma aba em segundo plano — e o participante passa o dia no terminal, não aqui.
const INTERVAL_MS = 5000;

// Olha a API local e avisa o hub. É este ping, e só ele, que acende os bloquinhos deste
// participante no painel de todo mundo.
export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SiteStatus>(CHECKING);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const [statusResult, profileResult] = await Promise.all([getStatus(), getProfile()]);

      const api = statusResult.ok;
      const db = statusResult.ok && statusResult.data.db === 'up';
      const nickname = profileResult.ok ? profileResult.data.nickname : null;

      const sent = await ping({ api, db, ...(nickname ? { nickname } : {}) });
      if (!active) return;

      setStatus({
        api: api ? 'up' : 'down',
        db: db ? 'up' : 'down',
        hub: sent.ok ? 'up' : 'down',
      });
    };

    run();
    const timer = setInterval(run, INTERVAL_MS);

    // Voltou para a aba: pinga na hora, sem esperar o próximo intervalo. Se o navegador
    // estrangulou os timers enquanto ela estava escondida, isso traz o cartão de volta.
    const onVisible = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return <StatusContext.Provider value={status}>{children}</StatusContext.Provider>;
}
