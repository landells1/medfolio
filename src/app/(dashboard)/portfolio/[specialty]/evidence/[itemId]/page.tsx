import { redirect } from 'next/navigation';

export default function PortfolioEvidenceRedirect({ params }: { params: { specialty: string; itemId: string } }) {
  redirect(`/training/${params.specialty}/evidence/${params.itemId}`);
}
