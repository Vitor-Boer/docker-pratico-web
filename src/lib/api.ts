import { request, type Result } from './http';
import type { ApiStatus, ParticipantView, Profile } from './types';

// URL da API local vista pelo navegador. Opcional; o padrão serve para a porta 3001 publicada.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const getStatus = () => request<ApiStatus>(`${API_URL}/status`);

export const getProfile = () => request<Profile>(`${API_URL}/profile`);

export const saveProfile = (nickname: string): Promise<Result<Profile>> =>
  request<Profile>(`${API_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });

// A sala vem pela API local, que busca no hub. Sem API no ar o quadro fica vazio: é a
// etapa 2 do workshop. O ping ao hub é o oposto e sai direto do navegador (ver ./hub).
export const getParticipants = () => request<ParticipantView[]>(`${API_URL}/participants`);

export const getParticipant = (id: string): Promise<Result<ParticipantView>> =>
  request<ParticipantView>(`${API_URL}/participants/${encodeURIComponent(id)}`);
