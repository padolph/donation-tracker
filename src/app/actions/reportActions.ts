'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface ReportItem {
  id: number;
  description: string;
  category: string;
  condition: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  valuationMethod: string;
}

export interface ReportDonation {
  id: number;
  date: Date;
  type: string;
  totalValue: number;
  items: ReportItem[];
}

export interface ReportOrganization {
  id: number;
  name: string;
  totalValue: number;
  donations: ReportDonation[];
}

export interface YearlyReportData {
  year: number;
  organizations: ReportOrganization[];
  grandTotal: number;
}

export async function getReportData(year: number) {
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
        organization: true,
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [
        { organization: { name: 'asc' } },
        { date: 'asc' },
      ],
    });

    const reportData: YearlyReportData = {
      year,
      organizations: [],
      grandTotal: 0,
    };

    const orgMap = new Map<number, ReportOrganization>();

    for (const event of donations) {
      let org = orgMap.get(event.organizationId);
      if (!org) {
        org = {
          id: event.organizationId,
          name: event.organization.name,
          totalValue: 0,
          donations: [],
        };
        orgMap.set(event.organizationId, org);
        reportData.organizations.push(org);
      }

      let eventTotal = 0;
      const reportItems: ReportItem[] = [];

      if (event.type === 'ITEMS') {
        for (const donatedItem of event.items) {
          const itemTotal = donatedItem.quantity * donatedItem.lockedValue;
          eventTotal += itemTotal;
          reportItems.push({
            id: donatedItem.id,
            description: donatedItem.item.description,
            category: donatedItem.item.category.name,
            condition: donatedItem.condition,
            quantity: donatedItem.quantity,
            unitValue: donatedItem.lockedValue,
            totalValue: itemTotal,
            valuationMethod: 'Thrift Shop Value',
          });
        }
      } else if (event.type === 'CASH' && event.cashAmount) {
        eventTotal = event.cashAmount;
        reportItems.push({
          id: event.id, // Use event ID for cash items as they don't have separate items
          description: 'Cash Donation',
          category: 'Cash',
          condition: 'N/A',
          quantity: 1,
          unitValue: event.cashAmount,
          totalValue: event.cashAmount,
          valuationMethod: 'Face Value',
        });
      } else if (event.type === 'ASSETS' && event.assetTicker) {
        // Assets logic: event.cashAmount stores the TOTAL value of the donation,
        // as entered by the user in the UI.
        const totalAssetValue = event.cashAmount || 0;
        const shares = event.assetShares || 0;
        const perShareValue = shares > 0 ? totalAssetValue / shares : totalAssetValue;

        eventTotal = totalAssetValue;
        reportItems.push({
          id: event.id,
          description: `Asset: ${event.assetTicker} (${shares} shares)`,
          category: 'Assets',
          condition: 'N/A',
          quantity: 1,
          unitValue: perShareValue,
          totalValue: totalAssetValue,
          valuationMethod: 'Market Quotations',
        });
      }

      org.donations.push({
        id: event.id,
        date: event.date,
        type: event.type,
        totalValue: eventTotal,
        items: reportItems,
      });

      org.totalValue += eventTotal;
      reportData.grandTotal += eventTotal;
    }

    return { success: true, data: reportData };
  } catch (error) {
    console.error('CRITICAL: getReportData failed', error);
    let message = 'An unexpected error occurred while fetching report data.';
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, error: message };
  }
}
