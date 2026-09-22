'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { getProfile, saveProfile } from '@/lib/api';
import { useSiteStatus } from './StatusProvider';

// Perfil = só o apelido, gravado no banco local. Quem leva o apelido até o painel é o
// ping do site, na próxima rodada. Sem banco no ar o cartão continua na tela, desabilitado.
export function ProfileCard() {
  const status = useSiteStatus();
  const dbUp = status.db === 'up';

  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!dbUp) return;
    getProfile().then((result) => {
      if (result.ok) setNickname(result.data.nickname ?? '');
    });
  }, [dbUp]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await saveProfile(nickname.trim());
    setMessage(result.ok ? 'Apelido salvo. Ele aparece no painel em instantes.' : 'Não foi possível salvar.');
    setBusy(false);
  }

  return (
    <form className="card" onSubmit={onSave}>
      <h2>Meu perfil</h2>

      <label htmlFor="nickname">Apelido</label>
      <input
        id="nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={40}
        required
        disabled={!dbUp || busy}
        placeholder={dbUp ? 'Como você quer aparecer' : ''}
      />

      <div className="actions">
        <button type="submit" disabled={!dbUp || busy}>
          Salvar
        </button>
      </div>

      {!dbUp && <p className="notice">Banco não conectado. Suba o banco para editar o perfil.</p>}
      {message && <p role="status">{message}</p>}
    </form>
  );
}
