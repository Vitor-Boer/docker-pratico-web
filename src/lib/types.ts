// GET {API}/status
export interface ApiStatus {
  db: 'up' | 'down';
}

// GET {API}/profile e PUT {API}/profile
export interface Profile {
  nickname: string | null;
}

// As três peças do desafio, como o painel as desenha: cada uma acesa ou apagada.
export interface Pieces {
  site: boolean;
  api: boolean;
  db: boolean;
}

// GET {HUB}/participants e GET {HUB}/participants/:id
export interface ParticipantView extends Pieces {
  id: string;
  name: string;
}
