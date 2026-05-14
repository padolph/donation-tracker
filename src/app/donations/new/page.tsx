import DonationBuilder from './DonationBuilder';
import { getOrganizations } from '@/app/actions/organizationActions';

export default async function NewDonationPage() {
  const organizations = await getOrganizations();

  return <DonationBuilder initialOrganizations={organizations} />;
}
