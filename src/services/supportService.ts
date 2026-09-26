/**
 * admin-dashboard/src/services/supportService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * REST API service for the admin support inbox.
 * Uses the same apiClient pattern as dashboard.ts.
 */

import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('adminAuthToken') || localStorage.getItem('authToken')
      : null;
  if (token) {
    (config.headers as any).Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type ThreadStatus = 'open' | 'pending' | 'active' | 'resolved' | 'closed';
export type ThreadTopic  = 'update_plan' | 'buy_plan' | 'booking_problem' | 'payment' | 'account' | 'other';

export interface SupportMessage {
  id:              string;
  thread:          string;
  sender_type:     'vendor' | 'agent' | 'system';
  sender_name:     string;
  message_type:    'text' | 'image' | 'file' | 'system';
  body:            string;
  attachment_url:  string | null;
  attachment_name: string | null;
  created_at:      string;
  is_mine:         boolean;
}

export interface SupportThread {
  id:                   string;
  vendor_name:          string;
  vendor_phone:         string | null;
  agent_name:           string | null;
  assigned_agent:       number | null;
  status:               ThreadStatus;
  status_display:       string;
  topic:                ThreadTopic;
  topic_display:        string;
  last_message_at:      string | null;
  last_message_preview: string;
  unread_agent_count:   number;
  unread_vendor_count:  number;
  created_at:           string;
  resolved_at:          string | null;
  closed_at:            string | null;
  messages:             SupportMessage[];
}

export interface ThreadListResponse {
  threads: SupportThread[];
  total:   number;
  page:    number;
  limit:   number;
}

export interface PaginatedMessagesResponse {
  messages: SupportMessage[];
  total:    number;
  page:     number;
  limit:    number;
  has_more: boolean;
}

export interface InboxStats {
  open:        number;
  pending:     number;
  active:      number;
  resolved:    number;
  closed:      number;
  unassigned:  number;
  my_threads:  number;
}

// ── Service class ─────────────────────────────────────────────────────────────

export class SupportService {
  private static readonly BASE = '/support';

  static async listThreads(params?: {
    status?:  string;
    topic?:   string;
    agent?:   string;
    search?:  string;
    page?:    number;
    limit?:   number;
  }): Promise<ThreadListResponse> {
    const res = await apiClient.get(`${this.BASE}/admin/threads/`, { params });
    return res.data;
  }

  static async getThread(threadId: string): Promise<SupportThread> {
    const res = await apiClient.get(`${this.BASE}/admin/threads/${threadId}/`);
    return res.data;
  }

  static async getMessages(
    threadId: string,
    params?: { page?: number; limit?: number; before?: string },
  ): Promise<PaginatedMessagesResponse> {
    const res = await apiClient.get(`${this.BASE}/admin/threads/${threadId}/messages/`, { params });
    return res.data;
  }

  static async sendReply(
    threadId: string,
    payload: { body?: string; message_type?: string; attachment_url?: string | null; attachment_name?: string | null },
  ): Promise<SupportMessage> {
    const res = await apiClient.post(`${this.BASE}/admin/threads/${threadId}/messages/`, payload);
    return res.data;
  }

  static async assignAgent(threadId: string, agentId?: number): Promise<{ success: boolean }> {
    const res = await apiClient.post(`${this.BASE}/admin/threads/${threadId}/assign/`, { agent_id: agentId });
    return res.data;
  }

  static async resolveThread(threadId: string): Promise<{ success: boolean }> {
    const res = await apiClient.post(`${this.BASE}/admin/threads/${threadId}/resolve/`);
    return res.data;
  }

  static async closeThread(threadId: string): Promise<{ success: boolean }> {
    const res = await apiClient.post(`${this.BASE}/admin/threads/${threadId}/close/`);
    return res.data;
  }

  static async getStats(): Promise<InboxStats> {
    const res = await apiClient.get(`${this.BASE}/admin/threads/stats/`);
    return res.data;
  }
}

// ── WebSocket helper ──────────────────────────────────────────────────────────
// Admin dashboard uses SSE-style polling for the thread list (30s)
// and a WebSocket for the open thread conversation.

export function buildAgentThreadWsUrl(threadId: string, token: string): string {
  const base   = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.scrapiz.in/api').replace(/\/api\/?$/, '');
  const proto  = base.startsWith('https://') ? 'wss' : 'ws';
  const host   = base.replace(/^https?:\/\//, '');
  const cleanToken = token.replace(/^Bearer\s+/i, '');
  return `${proto}://${host}/ws/support/agent/${threadId}/?token=${encodeURIComponent(cleanToken)}`;
}

export function buildAgentInboxWsUrl(token: string): string {
  const base   = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.scrapiz.in/api').replace(/\/api\/?$/, '');
  const proto  = base.startsWith('https://') ? 'wss' : 'ws';
  const host   = base.replace(/^https?:\/\//, '');
  const cleanToken = token.replace(/^Bearer\s+/i, '');
  return `${proto}://${host}/ws/support/agent/inbox/?token=${encodeURIComponent(cleanToken)}`;
}
