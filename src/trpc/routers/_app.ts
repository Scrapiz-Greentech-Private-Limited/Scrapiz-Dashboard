import { createTRPCRouter } from '../init';
import { supportRouter } from './support';

export const appRouter = createTRPCRouter({
  support: supportRouter,
});

export type AppRouter = typeof appRouter;
