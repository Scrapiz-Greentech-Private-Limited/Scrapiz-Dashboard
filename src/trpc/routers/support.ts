import axios from 'axios';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { baseProcedure, createTRPCRouter } from '../init';
import { API_CONFIG } from '@/components/backend/config';
import type {
  SupportThread,
  SupportMessage,
  ThreadListResponse,
  InboxStats,
  PaginatedMessagesResponse,
} from '@/services/supportService';

const BACKEND_TIMEOUT = 5000;

function getBackendHeaders(headers?: Headers): Record<string, string> | null {
  const authHeader = headers?.get('authorization') || '';
  if (!authHeader) {
    return null;
  }
  const result: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': authHeader,
  };
  const frontendKey =
    (API_CONFIG.HEADERS['x-auth-app'] as string) ||
    process.env.NEXT_PUBLIC_ADMIN_FRONTEND_SECRET ||
    process.env.NEXT_PUBLIC_FRONTEND_SECRET ||
    process.env.MY_ADMIN_FRONTEND_SECRET ||
    'ScrapizAdmin#0nn$(tab!z';
  if (frontendKey) {
    result['x-auth-app'] = frontendKey;
  }
  return result;
}

export const supportRouter = createTRPCRouter({
  listThreads: baseProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          topic: z.string().optional(),
          agent: z.string().optional(),
          search: z.string().optional(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(30),
        })
        .optional(),
    )
    .query(async ({ ctx, input }): Promise<ThreadListResponse> => {
      const headers = getBackendHeaders(ctx.headers);
      if (!headers) {
        return {
          threads: [],
          total: 0,
          page: input?.page ?? 1,
          limit: input?.limit ?? 30,
        };
      }
      try {
        const res = await axios.get<ThreadListResponse>(
          `${API_CONFIG.BASE_URL}/support/admin/threads/`,
          {
            headers,
            params: input,
            timeout: BACKEND_TIMEOUT,
          },
        );
        return res.data;
      } catch (error: any) {
        console.warn('[tRPC support.listThreads] Backend fetch failed:', error?.message);
        return {
          threads: [],
          total: 0,
          page: input?.page ?? 1,
          limit: input?.limit ?? 30,
        };
      }
    }),

  getThread: baseProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }): Promise<SupportThread> => {
      const headers = getBackendHeaders(ctx.headers);
      if (!headers) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Admin authorization required',
        });
      }
      try {
        const res = await axios.get<SupportThread>(
          `${API_CONFIG.BASE_URL}/support/admin/threads/${input.threadId}/`,
          {
            headers,
            timeout: BACKEND_TIMEOUT,
          },
        );
        return res.data;
      } catch (error: any) {
        console.warn('[tRPC support.getThread] Backend fetch failed:', error?.message);
        throw new TRPCError({
          code: error.response?.status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
          message: error.response?.data?.detail || error.message || 'Failed to fetch thread',
        });
      }
    }),

  getMessages: baseProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        before: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<PaginatedMessagesResponse> => {
      const headers = getBackendHeaders(ctx.headers);
      if (!headers) {
        return {
          messages: [],
          total: 0,
          page: input.page,
          limit: input.limit,
          has_more: false,
        };
      }
      try {
        const res = await axios.get<PaginatedMessagesResponse>(
          `${API_CONFIG.BASE_URL}/support/admin/threads/${input.threadId}/messages/`,
          {
            headers,
            params: {
              page: input.page,
              limit: input.limit,
              before: input.before,
            },
            timeout: BACKEND_TIMEOUT,
          },
        );
        return res.data;
      } catch (error: any) {
        console.warn('[tRPC support.getMessages] Backend fetch failed:', error?.message);
        return {
          messages: [],
          total: 0,
          page: input.page,
          limit: input.limit,
          has_more: false,
        };
      }
    }),

  getStats: baseProcedure.query(async ({ ctx }): Promise<InboxStats> => {
    const headers = getBackendHeaders(ctx.headers);
    if (!headers) {
      return {
        open: 0,
        pending: 0,
        active: 0,
        resolved: 0,
        closed: 0,
        unassigned: 0,
        my_threads: 0,
      };
    }
    try {
      const res = await axios.get<InboxStats>(
        `${API_CONFIG.BASE_URL}/support/admin/threads/stats/`,
        {
          headers,
          timeout: BACKEND_TIMEOUT,
        },
      );
      return res.data;
    } catch (error: any) {
      console.warn('[tRPC support.getStats] Backend fetch failed:', error?.message);
      return {
        open: 0,
        pending: 0,
        active: 0,
        resolved: 0,
        closed: 0,
        unassigned: 0,
        my_threads: 0,
      };
    }
  }),

  sendMessage: baseProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        body: z.string().optional().default(''),
        message_type: z.enum(['text', 'image', 'file', 'system']).default('text'),
        attachment_url: z.string().nullable().optional(),
        attachment_name: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<SupportMessage> => {
      const headers = getBackendHeaders(ctx.headers);
      if (!headers) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Admin authorization required',
        });
      }
      const { threadId, ...payload } = input;
      try {
        const res = await axios.post<SupportMessage>(
          `${API_CONFIG.BASE_URL}/support/admin/threads/${threadId}/messages/`,
          payload,
          {
            headers,
            timeout: BACKEND_TIMEOUT,
          },
        );
        return res.data;
      } catch (error: any) {
        throw new TRPCError({
          code: error.response?.status === 401 ? 'UNAUTHORIZED' : error.response?.status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST',
          message: error.response?.data?.detail || error.message || 'Failed to send message',
        });
      }
    }),

  assignAgent: baseProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        agentId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<{ success: boolean; assigned_agent?: number }> => {
      const headers = getBackendHeaders(ctx.headers);
      if (!headers) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Admin authorization required',
        });
      }
      try {
        const res = await axios.post<{ success: boolean; assigned_agent?: number }>(
          `${API_CONFIG.BASE_URL}/support/admin/threads/${input.threadId}/assign/`,
          { agent_id: input.agentId },
          {
            headers,
            timeout: BACKEND_TIMEOUT,
          },
        );
        return res.data;
      } catch (error: any) {
        throw new TRPCError({
          code: error.response?.status === 401 ? 'UNAUTHORIZED' : error.response?.status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST',
          message: error.response?.data?.detail || error.message || 'Failed to assign agent',
        });
      }
    }),

  resolveThread: baseProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<{ success: boolean; status: string }> => {
      const headers = getBackendHeaders(ctx.headers);
      if (!headers) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Admin authorization required',
        });
      }
      try {
        const res = await axios.post<{ success: boolean; status: string }>(
          `${API_CONFIG.BASE_URL}/support/admin/threads/${input.threadId}/resolve/`,
          {},
          {
            headers,
            timeout: BACKEND_TIMEOUT,
          },
        );
        return res.data;
      } catch (error: any) {
        throw new TRPCError({
          code: error.response?.status === 401 ? 'UNAUTHORIZED' : error.response?.status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST',
          message: error.response?.data?.detail || error.message || 'Failed to resolve thread',
        });
      }
    }),

  closeThread: baseProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<{ success: boolean; status: string }> => {
      const headers = getBackendHeaders(ctx.headers);
      if (!headers) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Admin authorization required',
        });
      }
      try {
        const res = await axios.post<{ success: boolean; status: string }>(
          `${API_CONFIG.BASE_URL}/support/admin/threads/${input.threadId}/close/`,
          {},
          {
            headers,
            timeout: BACKEND_TIMEOUT,
          },
        );
        return res.data;
      } catch (error: any) {
        throw new TRPCError({
          code: error.response?.status === 401 ? 'UNAUTHORIZED' : error.response?.status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST',
          message: error.response?.data?.detail || error.message || 'Failed to close thread',
        });
      }
    }),
});
