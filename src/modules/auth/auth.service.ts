import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError';
import { LoginInput, RegisterInput } from './auth.validation';

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

const signToken = (userId: string, role: Role) => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  };

  return jwt.sign({ userId, role }, env.JWT_SECRET, options);
};

export const authService = {
  register: async (input: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true }
    });

    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        password: hashedPassword,
        role: Role.USER
      },
      select: publicUserSelect
    });

    return {
      user,
      token: signToken(user.id, user.role)
    };
  },

  login: async (input: LoginInput) => {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Account migrated to Stack Auth — no legacy password to compare against.
    if (!user.password) {
      throw new AppError(
        'Ce compte utilise désormais Neon Auth. Veuillez vous connecter via la nouvelle interface.',
        410,
      );
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);

    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401);
    }

    const { password: _password, ...safeUser } = user;

    return {
      user: safeUser,
      token: signToken(user.id, user.role)
    };
  },

  getMe: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
};
