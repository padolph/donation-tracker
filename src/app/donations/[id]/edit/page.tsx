import { Suspense } from 'react';
import { getOrganizations } from '@/app/actions/organizationActions';
import { getDonationById } from '@/app/actions/donationActions';
import DonationBuilder from '@/app/donations/new/DonationBuilder';
import { notFound } from 'next/navigation';

export default async function EditDonationPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const donationId = parseInt(id, 10);
  
  if (isNaN(donationId)) {
    notFound();
  }

  const [orgResult, donationResult] = await Promise.all([
    getOrganizations(),
    getDonationById(donationId),
  ]);

  if (!donationResult.success || !donationResult.donation) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-4 sm:p-8 max-w-5xl mx-auto text-white/50">Loading form...</div>}>
      <DonationBuilder 
        initialOrganizations={orgResult}
        initialDonation={donationResult.donation}
      />
    </Suspense>
  );
}
