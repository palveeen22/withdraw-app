import { API_BASE_URL } from '@/shared/config';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

interface FetchOptions extends RequestInit {
  idempotencyKey?: string;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { idempotencyKey, ...init } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...(init.headers ?? {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body?.message ?? body?.error ?? message;
    } catch {
      // ignore parse error
    }

    if (response.status === 409) {
      throw new ApiError(409, 'CONFLICT', message);
    }

    throw new ApiError(response.status, 'API_ERROR', message);
  }

  return response.json() as Promise<T>;
}
