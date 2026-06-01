import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  credits: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  subscriptionCurrentPeriodEnd: true,
};

export const authService = {
  getMe: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  },
};
