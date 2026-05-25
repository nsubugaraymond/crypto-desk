import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

interface UserRecord {
  address: string;
  createdAt: number;
  lastActive: number;
  usdtBalance: string;
  trxBalance: string;
}

const users: Map<string, UserRecord> = new Map();

export const usersRouter = createTRPCRouter({
  registerUser: publicProcedure
    .input(z.object({
      address: z.string(),
      usdtBalance: z.string().optional(),
      trxBalance: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const now = Date.now();
      
      if (!users.has(input.address)) {
        users.set(input.address, {
          address: input.address,
          createdAt: now,
          lastActive: now,
          usdtBalance: input.usdtBalance || '0',
          trxBalance: input.trxBalance || '0',
        });
        console.log('New user registered:', input.address);
      } else {
        const user = users.get(input.address)!;
        user.lastActive = now;
        if (input.usdtBalance) user.usdtBalance = input.usdtBalance;
        if (input.trxBalance) user.trxBalance = input.trxBalance;
        users.set(input.address, user);
      }
      
      return { success: true };
    }),

  updateUserActivity: publicProcedure
    .input(z.object({
      address: z.string(),
      usdtBalance: z.string().optional(),
      trxBalance: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const user = users.get(input.address);
      
      if (user) {
        user.lastActive = Date.now();
        if (input.usdtBalance) user.usdtBalance = input.usdtBalance;
        if (input.trxBalance) user.trxBalance = input.trxBalance;
        users.set(input.address, user);
      }
      
      return { success: true };
    }),

  getAllUsers: publicProcedure.query(() => {
    return Array.from(users.values());
  }),

  getUserCount: publicProcedure.query(() => {
    return {
      total: users.size,
      active24h: Array.from(users.values()).filter(
        u => Date.now() - u.lastActive < 24 * 60 * 60 * 1000
      ).length,
    };
  }),
});
