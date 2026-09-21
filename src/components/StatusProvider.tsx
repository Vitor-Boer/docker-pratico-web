'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { getStatus } from '@/lib/api';
import { usePolling } from '@/lib/usePolling';

export type Light = 'checking' | 'up' | 'down';

export interface SiteStatus {
  api: Light;
  db: Light;
  hub: Light;
}

const CHECKING: SiteStatus = { api: 'checking', db: 'checking', hub: 'checking' };
const StatusContext = createContext<SiteStatus>(CHECKING);

export const useSiteStatus = () => useContext(StatusContext);

// Consulta GET /status da API local a cada 5 s. Sem resposta da API, tudo fica "down":
// é o estado idle do site (checkpoint 1), que mostra só a casca.
export function StatusProvider({ children }: { children: ReactNode }) {
  const result = usePolling(getStatus, 5000);

  let status = CHECKING;
  if (result) {
    status = result.ok
      ? { api: 'up', db: result.data.db, hub: result.data.hub }
      : { api: 'down', db: 'down', hub: 'down' };
  }

  return <StatusContext.Provider value={status}>{children}</StatusContext.Provider>;
}
