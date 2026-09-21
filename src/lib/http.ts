// O site precisa funcionar sem API/hub. Por isso nenhuma chamada lança exceção:
// falha de rede, timeout ou resposta de erro viram { ok: false }, e a tela mostra o estado.
export type Result<T> = { ok: true; data: T } | { ok: false; status?: number };

const TIMEOUT_MS = 2000;

export async function request<T>(
  url: string,
  init: RequestInit = {},
): Promise<Result<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const text = await response.text();
    return { ok: true, data: (text ? JSON.parse(text) : undefined) as T };
  } catch {
    return { ok: false };
  }
}
