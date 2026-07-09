import { Suspense } from 'react';
import DonationBuilder from './DonationBuilder';
import { getOrganizations } from '@/app/actions/organizationActions';

export default async function NewDonationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; orgId?: string; date?: string }>;
}) {
  const resolvedParams = await searchParams;
  const organizations = await getOrganizations();
  const key = `${resolvedParams.type || ''}-${resolvedParams.orgId || ''}-${resolvedParams.date || ''}`;

  return (
    <Suspense fallback={<div className="p-4 sm:p-8 max-w-5xl mx-auto text-white/50">Loading form...</div>}>
      <DonationBuilder key={key} initialOrganizations={organizations} />
    </Suspense>
  );
}
