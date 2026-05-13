import { getOrganizations } from '../actions/organizationActions';
import OrganizationsClient from './OrganizationsClient';

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return <OrganizationsClient initialOrganizations={organizations} />;
}
