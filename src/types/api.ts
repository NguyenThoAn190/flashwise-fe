/**
 * PlayGrid API Gateway Standard Envelopes & Error Types
 */

export interface ResponseMeta {
  timestamp: string;
  request_id?: string;
  [key: string]: unknown;
}

export interface PaginationMeta {
  page: number;
  limit?: number;
  page_size?: number;
  total: number;
  total_pages: number;
}

export interface StandardResponse<T> {
  data: T;
  meta?: ResponseMeta;
  pagination?: PaginationMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  service?: string;
  details?: unknown;
  status?: number;
}

export interface ErrorResponse {
  error: ApiErrorDetail | string;
  meta?: ResponseMeta;
  status?: number;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;
  public service?: string;

  constructor(status: number, code: string, message: string, details?: unknown, service?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.service = service;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromErrorResponse(status: number, data?: ErrorResponse | Record<string, unknown> | null): ApiError {
    if (!data || typeof data !== "object") {
      return new ApiError(status, "UNKNOWN_ERROR", `Request failed with status ${status}`);
    }

    // Case 1: Standard error envelope { error: { code, message, service, details } }
    if ("error" in data && typeof data.error === "object" && data.error !== null) {
      const err = data.error as ApiErrorDetail;
      const code = err.code || "UNKNOWN_ERROR";
      const message = err.message || `Request failed with status ${status}`;
      const details = err.details;
      const service = err.service || "api-gateway";
      return new ApiError(status, code, message, details, service);
    }

    // Case 2: Error string { error: "Something went wrong" }
    if ("error" in data && typeof data.error === "string") {
      return new ApiError(status, "ERROR", data.error, undefined, "api-gateway");
    }

    // Case 3: Message field { message: "Invalid credentials", code: "INVALID_CREDENTIALS" }
    if ("message" in data && typeof data.message === "string") {
      const code = typeof data.code === "string" ? data.code : "UNKNOWN_ERROR";
      return new ApiError(status, code, data.message, data.details, "api-gateway");
    }

    return new ApiError(status, "UNKNOWN_ERROR", `Request failed with status ${status}`);
  }
}
