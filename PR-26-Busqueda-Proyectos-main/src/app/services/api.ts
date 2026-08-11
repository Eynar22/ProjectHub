const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '/api'
  : 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  body?: any;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  // Solo agregar Content-Type si no es FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers: { ...headers, ...options.headers },
  };

  if (options.body && options.body instanceof FormData) {
    config.body = options.body;
  } else if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // La respuesta no vino en JSON (por ejemplo, un error 413 del propio servidor/proxy)
  }

  if (!response.ok) {
    const message = data?.message
      ?? (response.status === 413
        ? 'El archivo es demasiado grande para subirlo. Reduce su tamaño e intenta nuevamente.'
        : 'Ocurrió un error en la petición');
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => apiRequest<T>(endpoint, { method: 'POST', body }),
  patch: <T>(endpoint: string, body: any) => apiRequest<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
