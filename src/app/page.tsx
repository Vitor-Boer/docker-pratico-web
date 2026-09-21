import { Board } from '@/components/Board';
import { ProfileDock } from '@/components/ProfileDock';

// Renderiza sozinha, sem API: o quadro começa em branco e cada bloco cuida do próprio estado.
export default function HomePage() {
  return (
    <>
      <Board />
      <ProfileDock />
    </>
  );
}
