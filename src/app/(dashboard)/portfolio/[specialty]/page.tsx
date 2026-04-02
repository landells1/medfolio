import { redirect } from 'next/navigation';

export default function PortfolioRedirect({ params }: { params: { specialty: string } }) {
  redirect(`/training/${params.specialty}`);
}
