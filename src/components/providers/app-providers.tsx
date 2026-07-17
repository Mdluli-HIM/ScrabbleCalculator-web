"use client";

import {
  useState,
  type ReactNode,
} from "react";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  Toaster,
} from "sonner";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({
  children,
}: AppProvidersProps) {
  const [
    queryClient,
  ] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus:
              false,
          },

          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider
      client={queryClient}
    >
      {children}

      <Toaster
        position="top-center"
        richColors
        closeButton
      />
    </QueryClientProvider>
  );
}
