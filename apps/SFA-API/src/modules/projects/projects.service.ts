import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { CreateProjectInput, UpdateProjectInput } from './projects.validation';

const projectInclude = {
  _count: {
    select: {
      travaux: true,
      files: true
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
      include: {
        travaux: {
          orderBy: { lastMessageAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            posterType: true,
            format: true,
            lastMessageAt: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: { select: { travaux: true, files: true } }
      }
    });
  },

  getById: async (userId: string, projectId: string) => {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        files: { orderBy: { createdAt: 'desc' } },
        travaux: {
          orderBy: { lastMessageAt: 'desc' },
          include: {
            _count: { select: { messages: true, generatedPosters: true } }
          }
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
      where: { id: projectId, userId },
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
      where: { id: projectId, userId },
      select: { id: true }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await prisma.project.delete({ where: { id: projectId } });

    return { id: projectId };
  }
};
