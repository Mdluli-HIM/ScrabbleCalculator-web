import {
  apiRequest,
} from "@/lib/api/client";

import type {
  ApiHealthData,
  DatabaseHealthData,
} from "@/types/api";

export function getApiHealth():
  Promise<ApiHealthData> {
  return apiRequest<ApiHealthData>(
    "/health",
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export function getDatabaseHealth():
  Promise<DatabaseHealthData> {
  return apiRequest<DatabaseHealthData>(
    "/health/database",
    {
      method: "GET",
      cache: "no-store",
    },
  );
}
