import { getDonationById } from '@/app/actions/donationActions';
import DonationDetailsClient from './DonationDetailsClient';
import { notFound } from 'next/navigation';
import { DonationEvent } from '../DonationsClient';

export default async function DonationDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const donationId = parseInt(id, 10);
  
  if (isNaN(donationId)) {
    notFound();
    return null;
  }

  const result = await getDonationById(donationId);

  if (!result || !result.success || !result.donation) {
    notFound();
    return null;
  }

  return (
    <DonationDetailsClient 
      donation={result.donation as unknown as DonationEvent}
      relatedDonations={result.relatedDonations as unknown as DonationEvent[]}
    />
  );
}
