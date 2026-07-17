import {
  WelcomeErrorMessageScreen,
} from "@/components/welcome/welcome-error-message-screen";

import {
  WelcomeScreen,
} from "@/components/welcome/welcome-screen";

interface HomePageProps {
  searchParams: Promise<{
    state?: string | string[];
  }>;
}

export default async function HomePage({
  searchParams,
}: HomePageProps) {
  const params =
    await searchParams;

  const state =
    Array.isArray(
      params.state,
    )
      ? params.state[0]
      : params.state;

  if (state === "error-message") {
    return (
      <WelcomeErrorMessageScreen />
    );
  }

  return (
    <WelcomeScreen
      forceEmptyState={
        state === "empty"
      }
      forceLoadingState={
        state === "loading"
      }
      forceApiUnavailableState={
        state === "api-unavailable"
      }
      forceGuestSessionState={
        state === "guest-session"
      }
      forceSignedInSessionState={
        state === "signed-in-session"
      }
      forceDisabledButtonState={
        state === "disabled-button"
      }
    />
  );
}
