import {
  PlayersSetupScreen,
} from "@/components/match-setup/players-setup-screen";

interface PlayersSetupPageProps {
  searchParams: Promise<{
    state?: string | string[];
  }>;
}

export default async function PlayersSetupPage({
  searchParams,
}: PlayersSetupPageProps) {
  const params =
    await searchParams;

  const state =
    Array.isArray(
      params.state,
    )
      ? params.state[0]
      : params.state;

  return (
    <PlayersSetupScreen
      previewValid={
        state === "valid"
      }
      previewError={
        state === "error"
      }
    />
  );
}
