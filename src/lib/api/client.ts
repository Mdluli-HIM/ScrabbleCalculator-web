import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/types/api";

interface ApiRequestOptions
  extends Omit<RequestInit, "body"> {
  body?: unknown;
  accessToken?: string;
  guestSessionToken?: string;
}

export class ApiClientError
  extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
    super(message);

    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizePath(
  path: string,
): string {
  return path.startsWith("/")
    ? path
    : `/${path}`;
}

export async function apiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TData> {
  const {
    body,
    accessToken,
    guestSessionToken,
    headers:
      customHeaders,
    ...requestOptions
  } = options;

  const headers =
    new Headers(
      customHeaders,
    );

  if (
    accessToken
  ) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
  }

  if (
    guestSessionToken
  ) {
    headers.set(
      "x-guest-session-token",
      guestSessionToken,
    );
  }

  const isFormData =
    typeof FormData !==
      "undefined" &&
    body instanceof FormData;

  if (
    body !== undefined &&
    !isFormData
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const response =
    await fetch(
      `/backend${normalizePath(path)}`,
      {
        ...requestOptions,

        headers,

        body:
          body === undefined
            ? undefined
            : isFormData
              ? body
              : JSON.stringify(
                  body,
                ),
      },
    );

  let payload:
    | ApiSuccessResponse<TData>
    | ApiErrorResponse;

  try {
    payload =
      await response.json();
  } catch {
    throw new ApiClientError(
      "The API returned an unreadable response.",
      response.status,
      "INVALID_API_RESPONSE",
    );
  }

  if (
    !response.ok ||
    payload.success === false
  ) {
    const error =
      payload.success === false
        ? payload.error
        : undefined;

    throw new ApiClientError(
      error?.message ??
        "The request could not be completed.",
      response.status,
      error?.code ??
        "API_REQUEST_FAILED",
      error?.details,
    );
  }

  return payload.data;
}
