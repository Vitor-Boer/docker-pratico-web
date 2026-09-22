const KEY = 'docker-na-pratica:id';

// Quem é este participante, do ponto de vista do hub.
//
// Fica no localStorage de propósito: é o único lugar da máquina do participante que não
// mora dentro de um container. Ele pode reconstruir a imagem da API quantas vezes quiser,
// derrubar o banco, recriar tudo — o cartão dele no painel continua sendo o mesmo.
export function participantId(): string {
  const saved = localStorage.getItem(KEY);
  if (saved) return saved;

  const id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  return id;
}
