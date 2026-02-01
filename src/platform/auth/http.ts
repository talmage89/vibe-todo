export const fetchJsonOrThrow = async <T>(
  url: string,
  init: RequestInit,
  errorPrefix: string,
): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${errorPrefix}: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
};
