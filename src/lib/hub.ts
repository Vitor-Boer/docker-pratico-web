import { getHubSession } from './api';
import { request, type Result } from './http';
import type { HubSession, ParticipantView } from './types';

// Token USER (somente leitura) obtido da API local. Só existe com a API no ar.
// Guardado em memória e reaproveitado; se o hub responder 401, pede outro uma vez.
let session: HubSession | null = null;

async function callHub<T>(path: string, retry = true): Promise<Result<T>> {
  if (!session) {
    const fresh = await getHubSession();
    if (!fresh.ok) return { ok: false, status: fresh.status };
    session = fresh.data;
  }

  const result = await request<T>(`${session.hubUrl}${path}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!result.ok && result.status === 401 && retry) {
    session = null;
    return callHub<T>(path, false);
  }

  return result;
}

export const getParticipants = () => callHub<ParticipantView[]>('/participants');

export const getParticipant = (id: string) =>
  callHub<ParticipantView>(`/participants/${encodeURIComponent(id)}`);
