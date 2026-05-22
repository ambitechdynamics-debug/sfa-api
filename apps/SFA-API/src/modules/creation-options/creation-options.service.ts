import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAllCreationOptions(includeInactive = false) {
  return prisma.creationOption.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCreationOptionById(id: string) {
  return prisma.creationOption.findUnique({
    where: { id },
  });
}

export async function getCreationOptionBySlug(slug: string) {
  return prisma.creationOption.findUnique({
    where: { slug },
  });
}

export async function createCreationOption(data: any) {
  return prisma.creationOption.create({
    data,
  });
}

export async function updateCreationOption(id: string, data: any) {
  return prisma.creationOption.update({
    where: { id },
    data,
  });
}

export async function deleteCreationOption(id: string) {
  return prisma.creationOption.delete({
    where: { id },
  });
}
