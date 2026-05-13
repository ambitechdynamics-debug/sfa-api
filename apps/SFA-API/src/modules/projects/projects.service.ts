import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { CreateProjectInput, UpdateProjectInput } from './projects.validation';

const projectInclude = {
  _count: {
    select: {
      memoryEntries: true,
      files: true,
      generatedPosters: true
    }
  }
};

export const projectsService = {
  create: async (userId: string, input: CreateProjectInput) => {
    return prisma.project.create({
      data: {
        ...input,
        userId
      },
      include: projectInclude
    });
  },

  list: async (userId: string) => {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: projectInclude
    });
  },

  getById: async (userId: string, projectId: string) => {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId
      },
      include: {
        memoryEntries: {
          orderBy: { updatedAt: 'desc' }
        },
        files: {
          orderBy: { createdAt: 'desc' }
        },
        generatedPosters: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return project;
  },

  update: async (userId: string, projectId: string, input: UpdateProjectInput) => {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId
      },
      select: { id: true }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return prisma.project.update({
      where: { id: projectId },
      data: input,
      include: projectInclude
    });
  },

  delete: async (userId: string, projectId: string) => {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId
      },
      select: { id: true }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    return { id: projectId };
  }
};
