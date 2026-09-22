import { participantId } from './identity';
import { request, type Result } from './http';
import type { ParticipantView, Pieces } from './types';

// Hub do apresentador: fica na nuvem e nunca vai para a máquina do participante.
// O padrão abaixo é o hub oficial do workshop; NEXT_PUBLIC_HUB_URL só é necessária para
// apontar para outro. Atenção: NEXT_PUBLIC_* é embutida no build, não lida em runtime.
export const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL ?? 'https://hub.docker-na-pratica.com';

// Avisa o hub que este participante está no ar e quais peças já subiram. `site` não vai no
// corpo: se este código está rodando, o site está de pé, e o hub assume isso.
export const ping = (pieces: Omit<Pieces, 'site'> & { nickname?: string }) =>
  request<void>(`${HUB_URL}/participants/${participantId()}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pieces),
  });

export const getParticipants = () => request<ParticipantView[]>(`${HUB_URL}/participants`);

export const getParticipant = (id: string): Promise<Result<ParticipantView>> =>
  request<ParticipantView>(`${HUB_URL}/participants/${encodeURIComponent(id)}`);
