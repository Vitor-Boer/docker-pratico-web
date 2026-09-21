import type { Checkpoint } from '@/lib/types';

const LABELS: Record<Checkpoint, string> = {
  SITE: 'Site',
  API: 'API',
  DB: 'Banco',
};

export const checkpointLabel = (checkpoint: Checkpoint | null) =>
  checkpoint ? LABELS[checkpoint] : 'Começando';
