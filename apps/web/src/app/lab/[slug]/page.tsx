import { ExperimentLabDetailPage } from "@/components/platform-pages/experiment-lab-pages";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <ExperimentLabDetailPage slug={slug} />;
}

