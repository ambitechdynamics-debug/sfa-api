import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { UpdateMeInput } from './users.validation';

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  credits: true,
  createdAt: true,
  updatedAt: true
};

export const usersService = {
  getMe: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  },

  updateMe: async (userId: string, input: UpdateMeInput) => {
    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: publicUserSelect
    });
  }
};
