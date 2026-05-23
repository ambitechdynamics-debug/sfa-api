import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { CreateTravailInput, UpdateTravailInput } from './travaux.validation';

const ensureProjectOwner = async (userId: string, projectId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true }
  });
  if (!project) throw new AppError('Project not found', 404);
};

const ensureTravailOwner = async (userId: string, travailId: string) => {
  const travail = await prisma.travail.findFirst({
    where: { id: travailId, userId },
    select: { id: true }
  });
  if (!travail) throw new AppError('Travail not found', 404);
};

export const travauxService = {
  /**
   * Crée un nouveau travail (livrable) dans un projet (marque) existant.
   */
  create: async (userId: string, projectId: string, input: CreateTravailInput) => {
    await ensureProjectOwner(userId, projectId);

    return prisma.travail.create({
      data: {
        ...input,
        projectId,
        userId
      },
      include: {
        _count: { select: { messages: true, generatedPosters: true, files: true } }
      }
    });
  },

  /**
   * Liste tous les travaux de l'utilisateur, optionnellement filtrés par projet.
   */
  list: async (userId: string, projectId?: string) => {
    return prisma.travail.findMany({
      where: { userId, ...(projectId ? { projectId } : {}) },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        project: { select: { id: true, title: true } },
        _count: { select: { messages: true, generatedPosters: true } }
      }
    });
  },

  /**
   * Récupère un travail avec ses messages et tous ses dépendants.
   */
  getById: async (userId: string, travailId: string) => {
    const travail = await prisma.travail.findFirst({
      where: { id: travailId, userId },
      include: {
        project: { select: { id: true, title: true, brandDescription: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        files: { orderBy: { createdAt: 'desc' } },
        generatedPosters: { orderBy: { variationNumber: 'asc' } }
      }
    });
    if (!travail) throw new AppError('Travail not found', 404);
    return travail;
  },

  update: async (userId: string, travailId: string, input: UpdateTravailInput) => {
    await ensureTravailOwner(userId, travailId);
    return prisma.travail.update({
      where: { id: travailId },
      data: input,
      include: {
        _count: { select: { messages: true, generatedPosters: true, files: true } }
      }
    });
  },

  delete: async (userId: string, travailId: string) => {
    await ensureTravailOwner(userId, travailId);
    await prisma.travail.delete({ where: { id: travailId } });
    return { id: travailId };
  }
};
