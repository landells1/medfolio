import { redirect } from 'next/navigation';

// Analytics has been merged into the main dashboard page.
export default function AnalyticsPage() {
  redirect('/dashboard');
}
