import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

const BCRYPT_SALT_ROUNDS = 10;

const SAFE_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export const authService = {
  async createUser(data: {
    name: string;
    username: string;
    email?: string;
    password: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    return prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email || null,
        password: hashedPassword,
        role: "SISWA",
        isActive: true,
      },
      select: SAFE_SELECT,
    });
  },

  async getAllUsers(page = 1, pageSize = 20, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: SAFE_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async updateUserRole(
    userId: number,
    role: Role,
    currentUserId: number
  ) {
    if (userId === currentUserId) {
      throw new Error("CANNOT_CHANGE_OWN_ROLE");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: SAFE_SELECT,
    });
  },

  async toggleUserActive(
    userId: number,
    isActive: boolean,
    currentUserId: number
  ) {
    if (userId === currentUserId) {
      throw new Error("CANNOT_DEACTIVATE_OWN_ACCOUNT");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: SAFE_SELECT,
    });
  },

  async updateProfile(
    userId: number,
    data: { name?: string; username?: string; email?: string | null }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.email !== undefined && { email: data.email }),
      },
      select: SAFE_SELECT,
    });
  },

  async isUsernameTaken(username: string, excludeUserId?: number) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return false;
    if (excludeUserId && user.id === excludeUserId) return false;
    return true;
  },

  async isEmailTaken(email: string, excludeUserId?: number) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return false;
    if (excludeUserId && user.id === excludeUserId) return false;
    return true;
  },
};
