'use server';

import { prisma } from '@/lib/prisma';

export async function searchItems(query: string) {
  if (!query) return [];

  const terms = query.trim().split(/\s+/).filter(Boolean);
  
  return await prisma.item.findMany({
    where: {
      AND: terms.map((term) => ({
        description: {
          contains: term,
        },
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
    take: 50, // Increased limit for broader searches
  });
}

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getItemsByCategory(categoryId: number) {
  return await prisma.item.findMany({
    where: {
      categoryId,
    },
    include: {
      category: true,
    },
    orderBy: {
      description: 'asc',
    },
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
      leafName: data.description, // For custom items, description is the leaf
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
