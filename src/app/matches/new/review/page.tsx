import {
  ReviewMatchScreen,
} from "@/components/match-setup/review-match-screen";

interface ReviewSetupPageProps {
  searchParams: Promise<{
    state?: string | string[];
  }>;
}

export default async function ReviewSetupPage({
  searchParams,
}: ReviewSetupPageProps) {
  const params =
    await searchParams;

  const state =
    Array.isArray(
      params.state,
    )
      ? params.state[0]
      : params.state;

  return (
    <ReviewMatchScreen
      previewLoading={
        state === "loading"
      }
      previewError={
        state === "error"
      }
    />
  );
}
