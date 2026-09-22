import { participantId } from './identity';
import { request } from './http';
import type { Pieces } from './types';

// Hub do apresentador: fica na nuvem e nunca vai para a máquina do participante.
// O padrão abaixo é o hub oficial do workshop; NEXT_PUBLIC_HUB_URL só é necessária para
// apontar para outro. Atenção: NEXT_PUBLIC_* é embutida no build, não lida em runtime.
// Sem barra no final: as chamadas concatenam o caminho direto.
export const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL ?? 'https://prod-docker-pratico.gljr8e.easypanel.host';

// Única chamada que o navegador faz ao hub direto, e de propósito: é ela que prova que o
// site está no ar, então não pode depender da API local existir. Ler a sala é o contrário
// — passa pela API local (ver `getParticipants` em ./api), porque essa dependência é a
// etapa 2 do workshop.
export const ping = (pieces: Omit<Pieces, 'site'> & { nickname?: string }) =>
  request<void>(`${HUB_URL}/participants/${participantId()}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pieces),
  });
