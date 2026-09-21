// Formatos propostos em docs/arquitetura-hub.md e docs/api-participante.md do repo do hub.
// CONTRATO PENDENTE: ajuste aqui se as rotas ou payloads mudarem.

export type Checkpoint = 'SITE' | 'API' | 'DB';

export type ServiceState = 'up' | 'down';

// GET {API}/status
export interface ApiStatus {
  db: ServiceState;
  hub: ServiceState;
}

// GET {API}/profile e PUT {API}/profile
export interface Profile {
  nickname: string | null;
  // Só no PUT: false quando o apelido foi salvo no banco local mas o hub não foi avisado.
  synced?: boolean;
}

// GET {API}/hub/session
export interface HubSession {
  token: string;
  hubUrl: string;
}

// GET {HUB}/participants e GET {HUB}/participants/:id
export interface ParticipantView {
  id: string;
  name: string;
  checkpoint: Checkpoint | null;
}
