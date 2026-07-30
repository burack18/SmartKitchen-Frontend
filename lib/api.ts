// Shared, typed API client for the SmartKitchen backend.
// Base URL is read from the public env variable so it is available in the browser.

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  // Fail loudly during development if the env var is missing.
  console.warn(
    "NEXT_PUBLIC_API_BASE_URL is not set. API calls will fail until it is configured."
  );
}

/** Error thrown by the API client. Carries the HTTP status so callers can branch on it. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---- Auth types -------------------------------------------------------------

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiration: string;
  username: string;
  userID: string;
  refreshToken: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
}

// ---- Core request helper ----------------------------------------------------

async function request<T>(path: string, body: unknown): Promise<T> {
  const url = `${BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Network error / server unreachable / TLS issue.
    throw new ApiError(
      "Could not reach the server. Please check your connection and try again.",
      0
    );
  }

  if (!res.ok) {
    // Try to surface a useful message from the backend, fall back to status text.
    let message = res.statusText || "Request failed";
    try {
      const data = await res.json();
      if (typeof data === "string") {
        message = data;
      } else if (data && typeof data.message === "string") {
        message = data.message;
      } else if (data && typeof data.title === "string") {
        message = data.title;
      }
    } catch {
      // Response had no JSON body; keep the status text.
    }
    throw new ApiError(message, res.status);
  }

  // Some endpoints may return 200 with an empty body; guard against that.
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

// ---- Auth endpoints ---------------------------------------------------------

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>("/Auth/login", payload);
}

export function signup(payload: SignupRequest): Promise<unknown> {
  return request<unknown>("/Auth/signup", payload);
}