'use client';
/**
 * admin-dashboard/src/app/dashboard/support/SupportInboxClient.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Client Component: Support Inbox UI powered by tRPC & TanStack Query
 *
 * Features:
 *  - tRPC state for thread queries, paginated messages, sending replies, actions
 *  - Message pagination with "Load older messages" preserving scroll position
 *  - Real-time updates via WebSockets for inbox counts and live message stream
 *  - Responsive layout with filters, status badges, and quick agent actions
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SupportThread,
  SupportMessage,
  InboxStats,
  buildAgentThreadWsUrl,
  buildAgentInboxWsUrl,
} from '@/services/supportService';
import { useTRPC, useTRPCClient } from '@/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const STATUS_COLOR: Record<string, string> = {
  open:     'bg-blue-100 text-blue-700',
  pending:  'bg-yellow-100 text-yellow-700',
  active:   'bg-green-100 text-green-700',
  resolved: 'bg-gray-100 text-gray-600',
  closed:   'bg-red-50 text-red-500',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialThreads?: SupportThread[];
  initialTotal?:   number;
  initialStats?:   InboxStats;
}

const DEFAULT_STATS: InboxStats = {
  open: 0,
  pending: 0,
  active: 0,
  resolved: 0,
  closed: 0,
  unassigned: 0,
  my_threads: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SupportInboxClient({
  initialThreads = [],
  initialTotal = 0,
  initialStats = DEFAULT_STATS,
}: Props) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [agentFilter, setAgentFilter]   = useState<string | undefined>(undefined);
  const [activeLabel, setActiveLabel]   = useState<string>('Open');
  const [searchQuery, setSearchQuery]   = useState('');
  const [wsStatus, setWsStatus]         = useState<'connected' | 'disconnected'>('disconnected');

  // ── tRPC Queries with 2s background sync ─────────────────────────────────────
  const statsQuery = useQuery(
    trpc.support.getStats.queryOptions(undefined, {
      initialData: initialStats,
      refetchInterval: 2_000,
    }),
  );

  const threadsQuery = useQuery(
    trpc.support.listThreads.queryOptions(
      {
        status: statusFilter || undefined,
        agent: agentFilter || undefined,
        search: searchQuery || undefined,
        limit: 30,
      },
      {
        initialData: { threads: initialThreads, total: initialTotal, page: 1, limit: 30 },
        refetchInterval: 2_000,
      },
    ),
  );

  const stats = statsQuery.data ?? initialStats;
  const [threads, setThreads] = useState<SupportThread[]>(initialThreads);

  useEffect(() => {
    if (threadsQuery.data?.threads) {
      setThreads(threadsQuery.data.threads);
    }
  }, [threadsQuery.data?.threads]);

  // ── Active Thread & Message Pagination State ───────────────────────────────
  const [activeThread, setActiveThread]       = useState<SupportThread | null>(null);
  const [messages, setMessages]               = useState<SupportMessage[]>([]);
  const [messagePage, setMessagePage]         = useState<number>(1);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [totalMessages, setTotalMessages]     = useState<number>(0);
  const [isLoadingOlder, setIsLoadingOlder]   = useState<boolean>(false);
  const [isLoadingThread, setIsLoadingThread] = useState<boolean>(false);
  const [replyText, setReplyText]             = useState('');
  const [isSending, setIsSending]             = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef    = useRef<HTMLDivElement>(null);
  const threadWsRef      = useRef<WebSocket | null>(null);
  const inboxWsRef       = useRef<WebSocket | null>(null);
  const prevMsgCountRef  = useRef<number>(0);

  // ── Inbox WebSocket (Live preview & unread badge streaming) ────────────────
  useEffect(() => {
    const token =
      localStorage.getItem('adminAuthToken') ||
      localStorage.getItem('authToken') ||
      '';
    if (!token) return;

    const connect = () => {
      const ws = new WebSocket(buildAgentInboxWsUrl(token));
      inboxWsRef.current = ws;

      ws.onopen = () => setWsStatus('connected');
      ws.onclose = () => {
        setWsStatus('disconnected');
        setTimeout(connect, 4_000); // auto-reconnect
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'inbox_update') {
            setThreads((prev) =>
              prev.map((t) =>
                t.id === data.thread_id
                  ? {
                      ...t,
                      last_message_preview: data.preview,
                      last_message_at:      data.last_message_at,
                      unread_agent_count:   data.unread_agent_count,
                    }
                  : t,
              ),
            );
            void queryClient.invalidateQueries(trpc.support.getStats.queryFilter());
          }
        } catch { /* ignore */ }
      };
    };

    connect();
    return () => { inboxWsRef.current?.close(); };
  }, [queryClient, trpc.support.getStats]);

  // ── Open thread with initial paginated messages ────────────────────────────
  const openThread = useCallback(async (thread: SupportThread) => {
    threadWsRef.current?.close();

    setIsLoadingThread(true);
    setActiveThread(thread);
    setMessages([]);
    setMessagePage(1);
    setHasMoreMessages(false);

    try {
      // Call tRPC procedures for thread detail and first page of messages
      const [detail, pagedRes] = await Promise.all([
        trpcClient.support.getThread.query({ threadId: thread.id }),
        trpcClient.support.getMessages.query({ threadId: thread.id, page: 1, limit: 20 }),
      ]);

      setActiveThread(detail);
      setMessages(pagedRes.messages);
      setHasMoreMessages(pagedRes.has_more);
      setTotalMessages(pagedRes.total);
      setMessagePage(1);

      // Reset unread count for this thread in local thread list
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, unread_agent_count: 0 } : t)));

      // Connect thread-specific WebSocket for instant incoming replies
      const token =
        localStorage.getItem('adminAuthToken') ||
        localStorage.getItem('authToken') ||
        '';
      if (token) {
        const ws = new WebSocket(buildAgentThreadWsUrl(thread.id, token));
        threadWsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'chat_message') {
              const incoming: SupportMessage = {
                id:              data.message_id,
                thread:          data.thread_id,
                sender_type:     data.sender_type,
                sender_name:     data.sender_name ?? data.sender_type,
                message_type:    data.message_type ?? 'text',
                body:            data.body ?? '',
                attachment_url:  data.attachment_url ?? null,
                attachment_name: data.attachment_name ?? null,
                created_at:      data.created_at,
                is_mine:         false,
              };
              setMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id)) return prev;
                return [...prev, incoming];
              });
            }
          } catch { /* ignore */ }
        };
      }
    } catch (err) {
      console.error('Error opening thread:', err);
    } finally {
      setIsLoadingThread(false);
    }
  }, [trpcClient]);

  // ── Auto-select first thread in list if none active or active not in list ────
  useEffect(() => {
    if (threads.length > 0) {
      if (!activeThread || !threads.some((t) => t.id === activeThread.id)) {
        void openThread(threads[0]);
      }
    }
  }, [threads, activeThread, openThread]);

  // ── 2-second fallback polling for active thread messages ───────────────────
  useEffect(() => {
    if (!activeThread) return;
    const interval = setInterval(async () => {
      try {
        const res = await trpcClient.support.getMessages.query({
          threadId: activeThread.id,
          page: 1,
          limit: 20,
        });
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = res.messages.filter((m) => !existingIds.has(m.id));
          if (newOnes.length === 0) return prev;
          return [...prev, ...newOnes];
        });
      } catch {
        // quiet fallback
      }
    }, 2_000);
    return () => clearInterval(interval);
  }, [activeThread, trpcClient]);

  // ── Load older messages (Pagination) ───────────────────────────────────────
  const handleLoadOlderMessages = async () => {
    if (!activeThread || isLoadingOlder || !hasMoreMessages) return;
    setIsLoadingOlder(true);

    const container = chatContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;

    try {
      const nextPage = messagePage + 1;
      const res = await trpcClient.support.getMessages.query({
        threadId: activeThread.id,
        page: nextPage,
        limit: 20,
      });

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newOnes = res.messages.filter((m) => !existingIds.has(m.id));
        return [...newOnes, ...prev];
      });

      setMessagePage(nextPage);
      setHasMoreMessages(res.has_more);

      // Preserve scroll position without jumping
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop += (container.scrollHeight - prevScrollHeight);
        }
      });
    } catch (err) {
      console.error('Error loading older messages:', err);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // ── Scroll to bottom when new messages arrive ───────────────────────────────
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && !isLoadingOlder) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, isLoadingOlder]);

  // ── Send reply with tRPC mutation ───────────────────────────────────────────
  const sendMessageMutation = useMutation(
    trpc.support.sendMessage.mutationOptions({
      onSuccess: (sentMsg, variables) => {
        setMessages((prev) =>
          prev.map((m) => (m.id.startsWith('temp_') && m.body === variables.body ? { ...sentMsg, is_mine: true } : m)),
        );
        void queryClient.invalidateQueries(trpc.support.listThreads.queryFilter());
        void queryClient.invalidateQueries(trpc.support.getStats.queryFilter());
      },
      onError: (err, variables) => {
        setMessages((prev) => prev.filter((m) => !(m.id.startsWith('temp_') && m.body === variables.body)));
        setReplyText(variables.body ?? '');
      },
      onSettled: () => {
        setIsSending(false);
      },
    }),
  );

  const handleSendReply = () => {
    if (!activeThread || !replyText.trim() || isSending) return;
    setIsSending(true);

    const textToSend = replyText.trim();
    setReplyText('');

    // Optimistic message
    const tempMsg: SupportMessage = {
      id:              `temp_${Date.now()}`,
      thread:          activeThread.id,
      sender_type:     'agent',
      sender_name:     'You',
      message_type:    'text',
      body:            textToSend,
      attachment_url:  null,
      attachment_name: null,
      created_at:      new Date().toISOString(),
      is_mine:         true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    sendMessageMutation.mutate({
      threadId: activeThread.id,
      body: textToSend,
    });
  };

  // ── Quick actions with tRPC mutations ───────────────────────────────────────
  const assignMutation = useMutation(
    trpc.support.assignAgent.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.support.listThreads.queryFilter());
        void queryClient.invalidateQueries(trpc.support.getStats.queryFilter());
        if (activeThread) {
          trpcClient.support.getThread.query({ threadId: activeThread.id }).then(setActiveThread).catch(() => {});
        }
      },
    }),
  );

  const resolveMutation = useMutation(
    trpc.support.resolveThread.mutationOptions({
      onSuccess: () => {
        setActiveThread((prev) => (prev ? { ...prev, status: 'resolved' } : null));
        void queryClient.invalidateQueries(trpc.support.listThreads.queryFilter());
        void queryClient.invalidateQueries(trpc.support.getStats.queryFilter());
      },
    }),
  );

  const closeMutation = useMutation(
    trpc.support.closeThread.mutationOptions({
      onSuccess: () => {
        setActiveThread((prev) => (prev ? { ...prev, status: 'closed' } : null));
        void queryClient.invalidateQueries(trpc.support.listThreads.queryFilter());
        void queryClient.invalidateQueries(trpc.support.getStats.queryFilter());
      },
    }),
  );

  const handleAssignSelf = () => {
    if (!activeThread) return;
    assignMutation.mutate({ threadId: activeThread.id });
  };

  const handleResolve = () => {
    if (!activeThread) return;
    resolveMutation.mutate({ threadId: activeThread.id });
  };

  const handleClose = () => {
    if (!activeThread) return;
    closeMutation.mutate({ threadId: activeThread.id });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm">

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2.5 p-3 bg-white border-b border-gray-100 overflow-x-auto items-center no-scrollbar">
        {[
          { label: 'All',        value: stats.open + stats.pending + stats.active + stats.resolved + stats.closed, color: 'bg-indigo-500', status: '',        agent: undefined },
          { label: 'Active',     value: stats.active,     color: 'bg-green-500',  status: 'active',  agent: undefined },
          { label: 'Mine',       value: stats.my_threads, color: 'bg-purple-500', status: '',        agent: 'mine' },
          { label: 'Unassigned', value: stats.unassigned, color: 'bg-red-400',    status: '',        agent: 'unassigned' },
          { label: 'Open',       value: stats.open,       color: 'bg-blue-500',   status: 'open',    agent: undefined },
          { label: 'Pending',    value: stats.pending,    color: 'bg-yellow-500', status: 'pending', agent: undefined },
          { label: 'Resolved',   value: stats.resolved,   color: 'bg-gray-400',   status: 'resolved',agent: undefined },
          { label: 'Closed',     value: stats.closed,     color: 'bg-gray-500',   status: 'closed',  agent: undefined },
        ].map((s) => {
          const isSelected = activeLabel === s.label;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setActiveLabel(s.label);
                setStatusFilter(s.status);
                setAgentFilter(s.agent);
              }}
              className={`flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'bg-green-50 border-green-500 ring-2 ring-green-400/30 shadow-xs'
                  : 'bg-gray-50/90 hover:bg-gray-100/90 border-gray-200/70 text-gray-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
              <span className={`text-xs font-semibold ${isSelected ? 'text-green-900' : 'text-gray-700'}`}>
                {s.label}
              </span>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                  isSelected ? 'bg-green-200 text-green-950' : 'bg-gray-200/80 text-gray-900'
                }`}
              >
                {s.value}
              </span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400 pr-2 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <span>{wsStatus === 'connected' ? 'Live WebSocket' : 'Polling (2s)'}</span>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Thread list */}
        <div className="w-80 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
          {/* Filters */}
          <div className="p-3 border-b border-gray-100 flex flex-col gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor name..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                setAgentFilter(undefined);
                if (!val) setActiveLabel('All');
                else {
                  const cap = val.charAt(0).toUpperCase() + val.slice(1);
                  setActiveLabel(cap);
                }
              }}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none bg-white"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Thread rows */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {threads.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">No threads found</div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread)}
                  className={`w-full text-left p-3 border-b border-gray-50 hover:bg-green-50/60 transition-colors ${
                    activeThread?.id === thread.id ? 'bg-green-50 border-l-2 border-l-green-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900 truncate">{thread.vendor_name}</span>
                        {thread.unread_agent_count > 0 && (
                          <span className="flex-shrink-0 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {thread.unread_agent_count}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{thread.last_message_preview || 'No messages yet'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[thread.status] ?? ''}`}>
                        {thread.status_display}
                      </span>
                      {thread.last_message_at && (
                        <span className="text-[10px] text-gray-400">{timeAgo(thread.last_message_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">{thread.topic_display}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat pane */}
        {activeThread ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Thread header */}
            <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center justify-between shadow-xs">
              <div>
                <h2 className="font-bold text-sm text-gray-900">{activeThread.vendor_name}</h2>
                <p className="text-xs text-gray-500">
                  {activeThread.topic_display} ·{' '}
                  {activeThread.vendor_phone ?? 'No phone'} ·{' '}
                  Agent: {activeThread.agent_name ?? 'Unassigned'}
                </p>
              </div>
              <div className="flex gap-2">
                {!activeThread.assigned_agent && (
                  <button
                    onClick={handleAssignSelf}
                    disabled={assignMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    Assign to me
                  </button>
                )}
                {activeThread.status !== 'resolved' && activeThread.status !== 'closed' && (
                  <button
                    onClick={handleResolve}
                    disabled={resolveMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    Resolve
                  </button>
                )}
                {activeThread.status !== 'closed' && (
                  <button
                    onClick={handleClose}
                    disabled={closeMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Messages container with Pagination controls */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/40"
            >
              {/* Load older messages button if pagination has more */}
              {hasMoreMessages && (
                <div className="flex justify-center py-2">
                  <button
                    onClick={handleLoadOlderMessages}
                    disabled={isLoadingOlder}
                    className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium border border-emerald-200 transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingOlder ? (
                      <span>Loading older messages…</span>
                    ) : (
                      <>
                        <span>↑ Load older messages</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          ({messages.length} of {totalMessages})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {isLoadingThread ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-xs text-gray-400">Loading conversation…</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-xs text-gray-400">No messages yet</div>
                </div>
              ) : (
                messages.map((msg) => {
                  if (msg.sender_type === 'system') {
                    return (
                      <div key={msg.id} className="flex justify-center my-1">
                        <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full italic">{msg.body}</span>
                      </div>
                    );
                  }
                  const isAgent = msg.sender_type === 'agent';
                  return (
                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 shadow-2xs ${
                        isAgent
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
                      }`}>
                        {!isAgent && (
                          <p className="text-xs font-semibold text-green-600 mb-0.5">{msg.sender_name}</p>
                        )}
                        {msg.body && <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.body}</p>}
                        {msg.attachment_url && (
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 mt-1.5 text-xs underline ${isAgent ? 'text-green-100' : 'text-green-600'}`}
                          >
                            📎 {msg.attachment_name ?? 'Attachment'}
                          </a>
                        )}
                        <p className={`text-[10px] mt-1 ${isAgent ? 'text-green-200' : 'text-gray-400'} text-right`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Reply input */}
            {activeThread.status !== 'closed' ? (
              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); }
                    }}
                    placeholder="Type a reply… (Enter to send, Shift+Enter for newline)"
                    rows={2}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={isSending || !replyText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold disabled:opacity-40 hover:bg-green-700 transition-colors shadow-2xs"
                  >
                    {isSending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
                This thread is closed.
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-base font-semibold text-gray-700">Select a thread</h3>
              <p className="text-xs text-gray-400 mt-1">Choose a support conversation from the left to start</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
