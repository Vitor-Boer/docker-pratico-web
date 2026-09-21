'use client';

import { useState } from 'react';
import { ProfileCard } from './ProfileCard';

// O perfil fica recolhido num canto para não cobrir o quadro; abre sob demanda.
export function ProfileDock() {
  const [open, setOpen] = useState(false);

  return (
    <div className="dock" onPointerDown={(event) => event.stopPropagation()}>
      {open && <ProfileCard />}
      <button type="button" onClick={() => setOpen((v) => !v)}>
        {open ? 'Fechar' : 'Meu perfil'}
      </button>
    </div>
  );
}
