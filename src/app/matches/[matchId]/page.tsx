import {
  ActiveMatchScreen,
} from "@/components/active-match/active-match-screen";

interface MatchPageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export default async function MatchPage({
  params,
}: MatchPageProps) {
  const {
    matchId,
  } = await params;

  return (
    <ActiveMatchScreen
      matchId={matchId}
    />
  );
}
