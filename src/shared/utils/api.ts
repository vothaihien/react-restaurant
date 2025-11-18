export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

const resolveDefaultBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // if (typeof window !== 'undefined') {
  //     const { protocol, hostname, port } = window.location;
  //     // Nếu frontend đang chạy trên localhost thì ưu tiên domain nội bộ đã cấu hình sẵn
  //     const isLocalHost = !hostname || ['localhost', '127.0.0.1', '[::1]'].includes(hostname);

  //     // Nếu frontend đang chạy trên port 5555, dùng localhost:5555 cho backend
  //     if (isLocalHost && port === '5555') {
  //         return 'http://localhost:5555';
  //     }

  //     const targetHost = isLocalHost ? '192.168.100.47' : hostname;
  //     const defaultPort = protocol === 'https:' ? '7190' : '5134';
  //     return `${protocol}//${targetHost}:${defaultPort}`;
  // }

  return "http://localhost:5555";
};

const BASE_URL = resolveDefaultBaseUrl();

async function request<T>(
  path: string,
  options?: { method?: HttpMethod; body?: any; token?: string }
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.token) headers["Authorization"] = `Bearer ${options.token}`;
  const res = await fetch(url, {
    method: options?.method || "GET",
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// API core (BASE_URL + request). Các module API chức năng nằm trong `src/shared/api/*`.
export { BASE_URL, request };
