let csrfToken: string | null = null;
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (options.method && !["GET", "HEAD"].includes(options.method)) {
    if (!csrfToken) {
      const tokenResponse = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!tokenResponse.ok)
        throw new ApiError(
          "Сервис временно недоступен. Попробуйте ещё раз.",
          tokenResponse.status,
        );
      csrfToken = (await tokenResponse.json()).token;
    }
    headers.set("X-CSRF-TOKEN", csrfToken!);
  }
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const details = body.errors
      ? Object.values(body.errors).flat().join(" ")
      : body.detail;
    throw new ApiError(
      details ||
        body.title ||
        "Не удалось выполнить запрос. Попробуйте ещё раз.",
      response.status,
    );
  }
  if (path === "/auth/login" || path === "/auth/logout") csrfToken = null;
  if (response.status === 204) return undefined as T;
  return response.json();
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Произошла ошибка";
}
