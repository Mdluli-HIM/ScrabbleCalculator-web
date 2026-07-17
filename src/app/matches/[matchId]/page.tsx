import {
  PlaceholderScreen,
} from "@/components/system/placeholder-screen";

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
    <PlaceholderScreen
      eyebrow={`Saved match · ${matchId.slice(0, 8)}`}
      title="Your match was found."
      description="The saved match belongs to this browser session. The full active match interface will be designed and connected in its dedicated frontend sprint."
    />
  );
}
