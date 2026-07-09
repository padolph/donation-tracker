'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';

interface DonationData {
  organizationId: number;
  date: Date;
  type?: string;
  cashAmount?: number;
  assetTicker?: string;
  assetShares?: number;
  milesDriven?: number;
  parkingAndTolls?: number;
  mileageRate?: number;
  notes?: string;
  items: Array<{
    itemId: number;
    quantity: number;
    condition: string;
    lockedValue: number;
  }>;
  photos: string[];
}

export async function saveDonation(data: DonationData) {
  try {
    const donation = await prisma.donationEvent.create({
      data: {
        organizationId: data.organizationId,
        date: data.date,
        type: data.type || 'ITEMS',
        cashAmount: data.cashAmount,
        assetTicker: data.assetTicker,
        assetShares: data.assetShares,
        milesDriven: data.milesDriven,
        parkingAndTolls: data.parkingAndTolls,
        mileageRate: data.mileageRate,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            condition: item.condition,
            lockedValue: item.lockedValue,
          })),
        },
        photos: {
          create: data.photos.map((photoPath) => ({
            filePath: photoPath,
          })),
        },
      },
    });

    return { success: true, donation };
  } catch (error) {
    console.error('CRITICAL: saveDonation failed', error);
    
    // Provide a more descriptive error back to the client
    let message = 'An unexpected error occurred while saving the donation.';
    if (error instanceof Error) {
      message = error.message;
    }
    
    return { 
      success: false, 
      error: message 
    };
  }
}

export interface GetDonationsFilter {
  organizationId?: number;
  year?: number;
}

export async function getDonations(filter: GetDonationsFilter = {}) {
  try {
    const where: Prisma.DonationEventWhereInput = {};
    
    if (filter.organizationId) {
      where.organizationId = filter.organizationId;
    }
    
    if (filter.year) {
      const startDate = new Date(`${filter.year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${filter.year}-12-31T23:59:59.999Z`);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const donations = await prisma.donationEvent.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      include: {
        organization: true,
        items: {
          include: {
            item: true,
          },
        },
        photos: true,
      },
    });

    return { success: true, donations };
  } catch (error) {
    console.error('CRITICAL: getDonations failed', error);
    
    let message = 'An unexpected error occurred while fetching donations.';
    if (error instanceof Error) {
      message = error.message;
    }
    
    return {
      success: false,
      error: message,
    };
  }
}

import { revalidatePath } from 'next/cache';

export async function deleteDonation(id: number) {
  try {
    const donation = await prisma.donationEvent.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!donation) {
      throw new Error('Record not found');
    }

    await prisma.donationEvent.delete({
      where: { id },
    });

    // Delete associated photos on disk
    if (donation.photos && donation.photos.length > 0) {
      for (const photo of donation.photos) {
        if (photo.filePath) {
          try {
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            await fs.unlink(photo.filePath);
          } catch (unlinkError) {
            console.error('ERROR: Failed to delete photo file from disk', {
              filePath: photo.filePath,
              error: unlinkError instanceof Error ? unlinkError.message : String(unlinkError),
            });
          }
        }
      }
    }

    revalidatePath('/donations');
    return { success: true };
  } catch (error) {
    console.error('CRITICAL: deleteDonation failed', error);
    let message = 'An unexpected error occurred while deleting the donation.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, error: message };
  }
}

export async function getDonationById(id: number) {
  try {
    const donation = await prisma.donationEvent.findUnique({
      where: { id },
      include: {
        organization: true,
        items: {
          include: { item: true },
        },
        photos: true,
      },
    });

    if (!donation) {
      return { success: false, error: 'Donation not found' };
    }

    const relatedDonations = await prisma.donationEvent.findMany({
      where: {
        organizationId: donation.organizationId,
        date: donation.date,
        id: { not: donation.id },
      },
      include: {
        items: {
          include: { item: true },
        },
      },
    });

    return { success: true, donation, relatedDonations };
  } catch (error) {
    console.error('CRITICAL: getDonationById failed', error);
    let message = 'An unexpected error occurred while fetching the donation.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, error: message };
  }
}

export async function updateDonation(id: number, data: DonationData) {
  try {
    const updateData: Prisma.DonationEventUpdateInput = {
      organization: { connect: { id: data.organizationId } },
      date: data.date,
      type: data.type || 'ITEMS',
      cashAmount: data.cashAmount,
      assetTicker: data.assetTicker,
      assetShares: data.assetShares,
      milesDriven: data.milesDriven,
      parkingAndTolls: data.parkingAndTolls,
      mileageRate: data.mileageRate,
      notes: data.notes,
      items: {
        deleteMany: {},
        create: data.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          condition: item.condition,
          lockedValue: item.lockedValue,
        })),
      },
    };

    if (data.photos) {
      updateData.photos = {
        deleteMany: {},
        create: data.photos.map((photoPath) => ({
          filePath: photoPath,
        })),
      };
    }

    const donation = await prisma.donationEvent.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/donations');
    return { success: true, donation };
  } catch (error) {
    console.error('CRITICAL: updateDonation failed', error);
    let message = 'An unexpected error occurred while updating the donation.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, error: message };
  }
}
