import { Suspense } from 'react';
import DonationBuilder from './DonationBuilder';
import { getOrganizations } from '@/app/actions/organizationActions';

export default async function NewDonationPage() {
  const organizations = await getOrganizations();

  return (
    <Suspense fallback={<div className="p-4 sm:p-8 max-w-5xl mx-auto text-white/50">Loading form...</div>}>
      <DonationBuilder initialOrganizations={organizations} />
    </Suspense>
  );
}
