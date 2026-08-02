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

// ---- Container / Product types ---------------------------------------------

/** Response from GET /Container/status. Fields are nullable when empty. */
export interface ContainerStatus {
  containerId: string;
  currentWeight: number | null;
  fillPercentage: number | null;
  productName: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  isEmpty: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

/** Body for POST /Product. */
export interface AddProductRequest {
  containerId: string;
  name: string;
  expiryDate: string; // ISO string
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

// ---- Core request helpers ---------------------------------------------------

/** Read the auth token from localStorage (saved at login). Returns "" if missing. */
function getAuthToken(): string {
  try {
    return localStorage.getItem("token") ?? "";
  } catch {
    return "";
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** Whether to attach the Authorization header from localStorage. */
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "POST", body, auth = false } = options;
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
  return request<LoginResponse>("/Auth/login", { body: payload });
}

export function signup(payload: SignupRequest): Promise<unknown> {
  return request<unknown>("/Auth/signup", { body: payload });
}

// ---- Container / Product endpoints ------------------------------------------

/** Fetch the current container status (active product + fill info). */
export function getContainerStatus(): Promise<ContainerStatus> {
  return request<ContainerStatus>("/Container/status", { method: "GET", auth: true });
}

/** Add a product to a container (replaces any existing active product). */
export function addProduct(payload: AddProductRequest): Promise<unknown> {
  return request<unknown>("/Product", { body: payload, auth: true });
}
