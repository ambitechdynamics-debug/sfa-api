import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { CreateMemoryInput, UpdateMemoryInput } from './memory.validation';

const ensureTravailOwner = async (userId: string, travailId: string) => {
  const travail = await prisma.travail.findFirst({
    where: {
      id: travailId,
      userId
    },
    select: { id: true }
  });

  if (!travail) {
    throw new AppError('Travail not found', 404);
  }
};

const getMemoryDefByKey = async (memoryKey: string) => {
  const def = await prisma.memoryDefinition.findUnique({
    where: { key: memoryKey }
  });
  if (!def) {
    throw new AppError(`Memory definition '${memoryKey}' not found`, 404);
  }
  if (!def.isActive) {
    throw new AppError(`Memory definition '${memoryKey}' is inactive`, 400);
  }
  return def;
};

export const memoryService = {
  create: async (userId: string, travailId: string, input: CreateMemoryInput) => {
    await ensureTravailOwner(userId, travailId);
    const def = await getMemoryDefByKey(input.memoryKey);

    try {
      return await prisma.memoryEntry.create({
        data: {
          userId,
          travailId,
          memoryDefinitionId: def.id,
          content: input.content as Prisma.InputJsonValue
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(`Memory '${input.memoryKey}' already exists for this travail`, 409);
      }
      throw error;
    }
  },

  list: async (userId: string, travailId: string) => {
    await ensureTravailOwner(userId, travailId);

    return prisma.memoryEntry.findMany({
      where: { travailId },
      include: {
        memoryDefinition: {
          select: {
            key: true,
            name: true,
            description: true,
            scope: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  getByKey: async (userId: string, travailId: string, memoryKey: string) => {
    await ensureTravailOwner(userId, travailId);
    const def = await getMemoryDefByKey(memoryKey);

    const memory = await prisma.memoryEntry.findUnique({
      where: {
        travailId_memoryDefinitionId: {
          travailId,
          memoryDefinitionId: def.id
        }
      },
      include: {
        memoryDefinition: {
          select: { key: true, name: true }
        }
      }
    });

    if (!memory) {
      throw new AppError(`Memory '${memoryKey}' not found for this travail`, 404);
    }

    return memory;
  },

  updateByKey: async (userId: string, travailId: string, memoryKey: string, input: UpdateMemoryInput) => {
    await ensureTravailOwner(userId, travailId);
    const def = await getMemoryDefByKey(memoryKey);

    const memory = await prisma.memoryEntry.findUnique({
      where: {
        travailId_memoryDefinitionId: {
          travailId,
          memoryDefinitionId: def.id
        }
      },
      select: { id: true }
    });

    if (!memory) {
      throw new AppError(`Memory '${memoryKey}' not found for this travail`, 404);
    }

    return prisma.memoryEntry.update({
      where: { id: memory.id },
      data: {
        content: input.content as Prisma.InputJsonValue
      },
      include: {
        memoryDefinition: {
          select: { key: true, name: true }
        }
      }
    });
  },

  deleteByKey: async (userId: string, travailId: string, memoryKey: string) => {
    await ensureTravailOwner(userId, travailId);
    const def = await getMemoryDefByKey(memoryKey);

    const memory = await prisma.memoryEntry.findUnique({
      where: {
        travailId_memoryDefinitionId: {
          travailId,
          memoryDefinitionId: def.id
        }
      },
      select: { id: true }
    });

    if (!memory) {
      throw new AppError(`Memory '${memoryKey}' not found for this travail`, 404);
    }

    await prisma.memoryEntry.delete({
      where: { id: memory.id }
    });

    return { memoryKey };
  }
};
