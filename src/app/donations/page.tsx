import React from 'react';
import DonationsClient, { DonationEvent } from './DonationsClient';
import { getDonations } from '@/app/actions/donationActions';
import { getOrganizations } from '@/app/actions/organizationActions';

export default async function DonationsPage() {
  const [donationsResult, organizations] = await Promise.all([
    getDonations({}),
    getOrganizations(),
  ]);

  const donations = donationsResult.success && donationsResult.donations ? donationsResult.donations : [];

  return (
    <DonationsClient 
      initialDonations={donations as unknown as DonationEvent[]} 
      organizations={organizations} 
    />
  );
}
