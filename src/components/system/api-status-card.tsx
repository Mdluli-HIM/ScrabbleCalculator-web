"use client";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  Activity,
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  TriangleAlert,
} from "lucide-react";

import {
  getApiHealth,
  getDatabaseHealth,
} from "@/lib/api/health";

import {
  cn,
} from "@/lib/utils";

interface StatusRowProps {
  icon:
    React.ComponentType<{
      className?: string;
    }>;

  label: string;
  value: string;
  connected: boolean;
  loading?: boolean;
}

function StatusRow({
  icon: Icon,
  label,
  value,
  connected,
  loading = false,
}: StatusRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        "rounded-2xl border",
        "border-black/8",
        "bg-black/[0.02]",
        "px-4 py-3.5",
      )}
    >
      <div
        className={cn(
          "grid size-10",
          "shrink-0",
          "place-items-center",
          "rounded-xl",
          connected
            ? "bg-emerald-500/10 text-emerald-700"
            : "bg-black/5 text-black/45",
        )}
      >
        <Icon
          className="size-5"
        />
      </div>

      <div
        className="min-w-0 flex-1"
      >
        <p
          className="text-xs font-medium uppercase tracking-[0.14em] text-black/45"
        >
          {label}
        </p>

        <p
          className="mt-0.5 truncate text-sm font-semibold text-black"
        >
          {loading
            ? "Checking…"
            : value}
        </p>
      </div>

      {loading ? (
        <RefreshCw
          className="size-4 animate-spin text-black/35"
        />
      ) : connected ? (
        <CheckCircle2
          className="size-5 text-emerald-600"
        />
      ) : (
        <TriangleAlert
          className="size-5 text-amber-600"
        />
      )}
    </div>
  );
}

export function ApiStatusCard() {
  const apiHealth =
    useQuery({
      queryKey: [
        "system",
        "api-health",
      ],

      queryFn:
        getApiHealth,
    });

  const databaseHealth =
    useQuery({
      queryKey: [
        "system",
        "database-health",
    ],

      queryFn:
        getDatabaseHealth,
    });

  const isRefreshing =
    apiHealth.isFetching ||
    databaseHealth.isFetching;

  async function handleRefresh():
    Promise<void> {
    await Promise.all([
      apiHealth.refetch(),
      databaseHealth.refetch(),
    ]);
  }

  return (
    <section
      className={cn(
        "rounded-[1.75rem]",
        "border border-black/10",
        "bg-white",
        "p-4 shadow-[0_24px_70px_rgba(0,0,0,0.08)]",
        "sm:p-5",
      )}
    >
      <div
        className="mb-5 flex items-start justify-between gap-4"
      >
        <div>
          <div
            className="flex items-center gap-2 text-sm font-semibold text-black"
          >
            <Activity
              className="size-4"
            />

            System connection
          </div>

          <p
            className="mt-1 max-w-sm text-sm leading-6 text-black/55"
          >
            This temporary screen confirms
            that the new frontend can reach
            the existing Scrabble API.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleRefresh
          }
          disabled={
            isRefreshing
          }
          className={cn(
            "grid size-10",
            "shrink-0",
            "place-items-center",
            "rounded-full",
            "border border-black/10",
            "bg-white",
            "transition",
            "hover:bg-black hover:text-white",
            "disabled:cursor-not-allowed",
            "disabled:opacity-50",
          )}
          aria-label="Refresh system status"
        >
          <RefreshCw
            className={cn(
              "size-4",
              isRefreshing &&
                "animate-spin",
            )}
          />
        </button>
      </div>

      <div
        className="grid gap-3"
      >
        <StatusRow
          icon={Server}
          label="API server"
          value={
            apiHealth.data
              ? `${apiHealth.data.service} · v${apiHealth.data.version}`
              : apiHealth.error instanceof
                    Error
                ? apiHealth.error.message
                : "Unavailable"
          }
          connected={
            apiHealth.isSuccess
          }
          loading={
            apiHealth.isLoading
          }
        />

        <StatusRow
          icon={Database}
          label="PostgreSQL database"
          value={
            databaseHealth.isSuccess
              ? "Connected and available"
              : databaseHealth.error instanceof
                    Error
                ? databaseHealth.error.message
                : "Unavailable"
          }
          connected={
            databaseHealth.isSuccess
          }
          loading={
            databaseHealth.isLoading
          }
        />
      </div>
    </section>
  );
}
