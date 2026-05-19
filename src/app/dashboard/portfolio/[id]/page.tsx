import PortfolioEditor from '@/components/portfolio/PortfolioEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPortfolioPage({ params }: Props) {
  const { id } = await params;
  return <PortfolioEditor pageId={id} />;
}
