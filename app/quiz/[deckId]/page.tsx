import { QuizPageClient } from './QuizPageClient';

export default async function QuizPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  return <QuizPageClient deckId={deckId} />;
}
