import {
  MatchResultsScreen,
} from "@/components/match-results/match-results-screen";

interface MatchResultsPageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export default async function MatchResultsPage({
  params,
}: MatchResultsPageProps) {
  const {
    matchId,
  } = await params;

  return (
    <MatchResultsScreen
      matchId={matchId}
    />
  );
}
