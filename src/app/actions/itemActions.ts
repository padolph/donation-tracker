'use server';

import { prisma } from '@/lib/prisma';

export async function searchItems(query: string) {
  if (!query) return [];

  const terms = query.trim().split(/\s+/).filter(Boolean);
  
  return await prisma.item.findMany({
    where: {
      AND: terms.map((term) => ({
        OR: [
          {
            description: {
              contains: term,
            },
          },
          {
            category: {
              name: {
                contains: term,
              },
            },
          },
        ],
      })),
    },
    include: {
      category: true,
    },
    orderBy: [
      {
        category: {
          name: 'asc',
        },
      },
      {
        description: 'asc',
      },
    ],
    take: 20,
  });
}

export async function createCustomItem(data: {
  description: string;
  categoryName: string;
  defaultHigh: number;
  defaultMedium: number;
}) {
  return await prisma.item.create({
    data: {
      description: data.description,
      defaultHigh: data.defaultHigh,
      defaultMedium: data.defaultMedium,
      isCustomItem: true,
      category: {
        connectOrCreate: {
          where: { name: data.categoryName },
          create: { name: data.categoryName },
        },
      },
    },
    include: {
      category: true,
    },
  });
}
