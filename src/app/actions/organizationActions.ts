'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface OrganizationData {
  name: string;
  address?: string | null;
  taxId?: string | null;
  defaultCategory?: string | null;
}

export async function getOrganizations() {
  const organizations = await prisma.organization.findMany({
    include: {
      donations: {
        include: {
          items: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return organizations.map((org) => {
    let totalDonated = 0;
    for (const donation of org.donations) {
      if (donation.cashAmount) {
        totalDonated += donation.cashAmount;
      }
      for (const item of donation.items) {
        totalDonated += item.lockedValue * item.quantity;
      }
    }

    return {
      id: org.id,
      name: org.name,
      address: org.address,
      taxId: org.taxId,
      totalDonated,
      donationCount: org.donations.length,
    };
  });
}

export async function createOrganization(data: OrganizationData) {
  try {
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        address: data.address,
        taxId: data.taxId,
      },
    });

    revalidatePath('/organizations');
    return { success: true, organization };
  } catch (error) {
    let message = 'An unexpected error occurred while creating the organization.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, error: message };
  }
}

export async function updateOrganization(id: number, data: OrganizationData) {
  try {
    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        taxId: data.taxId,
      },
    });

    revalidatePath('/organizations');
    return { success: true, organization };
  } catch (error) {
    let message = 'An unexpected error occurred while updating the organization.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, error: message };
  }
}

export async function deleteOrganization(id: number) {
  try {
    const donationCount = await prisma.donationEvent.count({
      where: { organizationId: id },
    });

    if (donationCount > 0) {
      return {
        success: false,
        error: 'Cannot delete organization because it has associated donations. Please delete all donations to this organization first.',
      };
    }

    await prisma.organization.delete({
      where: { id },
    });

    revalidatePath('/organizations');
    return { success: true };
  } catch (error) {
    let message = 'An unexpected error occurred while deleting the organization.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, error: message };
  }
}
