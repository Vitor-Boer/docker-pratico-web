'use client';

import { useSiteStatus, type Light } from './StatusProvider';

const LABEL: Record<Light, string> = {
  checking: 'verificando',
  up: 'online',
  down: 'offline',
};

function Badge({ name, state }: { name: string; state: Light }) {
  return (
    <li className={`badge badge-${state}`}>
      <span className="dot" />
      {name}: {LABEL[state]}
    </li>
  );
}

export function StatusBar() {
  const status = useSiteStatus();

  return (
    <ul className="status-bar" aria-label="Estado dos serviços">
      <Badge name="API" state={status.api} />
      <Badge name="Banco" state={status.db} />
      <Badge name="Hub" state={status.hub} />
    </ul>
  );
}
