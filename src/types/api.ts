export interface ApiMeta {
  requestId: string;
  timestamp: string;

  [key: string]: unknown;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  message: string;
  data: TData;
  meta: ApiMeta;
}

export interface ApiErrorDetails {
  [key: string]: unknown;
}

export interface ApiErrorInformation {
  code: string;
  message: string;
  details?: ApiErrorDetails;
}

export interface ApiErrorResponse {
  success: false;
  message?: string;
  error: ApiErrorInformation;
  meta?: ApiMeta;
}

export interface ApiHealthData {
  service: string;
  version: string;
  status: string;
  uptimeSeconds: number;
  environment: string;
}

export type DatabaseHealthData =
  Record<string, unknown>;
