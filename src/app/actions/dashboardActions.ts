'use server';

import { prisma } from '@/lib/prisma';
import { calculateTaxSavings } from '@/utils/calculators/resolver';

export async function getDashboardStats(year: number) {
  try {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const donations = await prisma.donationEvent.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
    });

    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    });
    const marginalTaxRate = settings?.marginalTaxRate ?? 0.22;

    let itemsTotal = 0;
    let cashTotal = 0;
    let assetsTotal = 0;
    const organizationIds = new Set<number>();

    donations.forEach((donation) => {
      organizationIds.add(donation.organizationId);

      if (donation.type === 'ITEMS') {
        const donationItemsTotal = donation.items.reduce(
          (sum, item) => sum + item.lockedValue * item.quantity,
          0
        );
        itemsTotal += donationItemsTotal;
      } else if (donation.type === 'CASH') {
        cashTotal += donation.cashAmount ?? 0;
      } else if (donation.type === 'ASSETS') {
        assetsTotal += donation.cashAmount ?? 0;
      }
    });

    const totalDonated = itemsTotal + cashTotal + assetsTotal;
    
    const estimatedAGI = settings?.estimatedAGI ?? 100000.0;
    const calculation = calculateTaxSavings(year, {
      estimatedAGI,
      marginalTaxRate,
      itemsTotal,
      cashTotal,
      assetsTotal,
    });

    return {
      success: true,
      stats: {
        totalDonated,
        itemsTotal,
        cashTotal,
        assetsTotal,
        organizationCount: organizationIds.size,
        taxSavings: calculation.taxSavings,
        marginalTaxRate,
        estimatedAGI,
        calculationState: calculation.state,
        floor: calculation.floor,
        floorRemaining: calculation.floorRemaining,
        allowedContributionsRemaining: calculation.allowedContributionsRemaining,
        cashRoomRemaining: calculation.cashRoomRemaining,
        physicalRoomRemaining: calculation.physicalRoomRemaining,
        assetRoomRemaining: calculation.assetRoomRemaining,
      },
    };
  } catch (error) {
    console.error('CRITICAL: getDashboardStats failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
    };
  }
}
