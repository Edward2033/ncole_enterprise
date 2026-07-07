import React, { useEffect, useState, useCallback } from 'react';
import { Bot, RefreshCw, CheckCircle, XCircle, AlertCircle, Cpu, Zap, MessageSquare, User } from 'lucide-react';
import { apiFetch } from '@/services/api';
import { adminActivityLogApi } from '@/services/adminApi';
import { fmtDateTime } from '@/lib/adminFormat';

interface AiHealthStatus {
  configured: boolean;
  model: string;
  recentInteractions: number;
}

interface RecentLog {
  id: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  user?: { name: string; email: string } | null;
}

interface TestResult { success: boolean; reply?: string; error?: string; }

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 py-3 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-900 dark:text-white">{value}</span>
  </div>
);

const StatusBadge: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
    ok
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  }`}>
    {ok ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
    {label}
  </span>
);

const PORTAL_COLORS: Record<string, string> = {
  PUBLIC:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CUSTOMER: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  VENDOR:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  RIDER:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ADMIN:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const AdminAiSettingsPage: React.FC = () => {
  const [status, setStatus]         = useState<AiHealthStatus | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [testMsg, setTestMsg]       = useState('What products do you have available?');
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await apiFetch<{ success: boolean; data: { reply: string } }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'ping', portal: 'PUBLIC', history: [] }),
      });
      setStatus({
        configured: true,
        model: import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash',
        recentInteractions: 0,
      });
    } catch (e) {
      const msg = (e as Error).message ?? '';
      const isNotConfigured =
        msg.toLowerCase().includes('not configured') ||
        msg.toLowerCase().includes('api key') ||
        msg.toLowerCase().includes('503') ||
        msg.toLowerCase().includes('not available');
      setStatus({
        configured: !isNotConfigured,
        model: import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash',
        recentInteractions: 0,
      });
      if (!isNotConfigured) setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // loadLogs has NO dependency on status — avoids infinite re-render loop
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await adminActivityLogApi.list(1, 20, 'AI_INTERACTION');
      setRecentLogs(
        res.data.map(l => ({
          id: l.id,
          createdAt: l.createdAt,
          metadata: l.metadata,
          user: l.user ?? null,
        }))
      );
      // Update total count without triggering a re-render loop
      setStatus(s => s ? { ...s, recentInteractions: res.meta.total } : s);
    } catch {
      // non-critical — silently ignore
    } finally {
      setLogsLoading(false);
    }
  }, []); // intentionally empty deps

  useEffect(() => { loadStatus(); }, [loadStatus]);
  // Run loadLogs once after the status check completes
  useEffect(() => { if (!loading) loadLogs(); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMsg.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await apiFetch<{ success: boolean; data: { reply: string } }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: testMsg.trim(), portal: 'ADMIN', history: [] }),
      });
      setTestResult({ success: true, reply: res.data.reply });
    } catch (e) {
      setTestResult({ success: false, error: (e as Error).message });
    } finally {
      setTesting(false);
    }
  };

  const handleRefresh = () => {
    setTestResult(null);
    setRecentLogs([]);
    loadStatus();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <Bot className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Settings</h1>
            <p className="text-sm text-slate-500">Google Gemini integration status and configuration</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">AI service error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600">
              <Cpu className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Integration Status</h2>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-8 rounded-xl bg-slate-100 dark:bg-slate-700" />)}
            </div>
          ) : (
            <div className="space-y-1">
              <InfoRow
                label="API Key"
                value={<StatusBadge ok={status?.configured ?? false} label={status?.configured ? 'Configured' : 'Not configured'} />}
              />
              <InfoRow
                label="Service Status"
                value={<StatusBadge ok={status?.configured ?? false} label={status?.configured ? 'Operational' : 'Unavailable'} />}
              />
              <InfoRow
                label="Model"
                value={<span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">{status?.model ?? '—'}</span>}
              />
              <InfoRow
                label="Total AI Interactions"
                value={logsLoading ? '…' : (status?.recentInteractions ?? 0).toLocaleString()}
              />
              <InfoRow
                label="Portals"
                value={<span className="text-xs text-slate-500">Public · Customer · Vendor · Rider · Admin</span>}
              />
            </div>
          )}

          {!loading && !status?.configured && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <p className="font-semibold">To enable AI:</p>
              <p>Set <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">GEMINI_API_KEY</code> in <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">backend/.env</code> and restart the server.</p>
              <p>Obtain a key from <span className="underline">ai.google.dev</span>.</p>
            </div>
          )}
        </div>

        {/* Portal capabilities */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600">
              <Zap className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Portal Capabilities</h2>
          </div>
          <div className="space-y-3">
            {([
              { portal: 'Public',   auth: false, capabilities: 'Product discovery, FAQ, recommendations' },
              { portal: 'Customer', auth: true,  capabilities: 'Order/invoice help, delivery status, product suggestions' },
              { portal: 'Vendor',   auth: true,  capabilities: 'Sales insights, inventory alerts, performance trends' },
              { portal: 'Rider',    auth: true,  capabilities: 'Delivery guidance, status transitions, statistics' },
              { portal: 'Admin',    auth: true,  capabilities: 'Revenue analytics, order/vendor/customer analysis' },
            ] as const).map(({ portal, auth, capabilities }) => (
              <div key={portal} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <StatusBadge ok={status?.configured ?? false} label={portal} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{capabilities}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{auth ? 'Requires authentication' : 'Public — no auth required'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live test */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600">
            <MessageSquare className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-white">Live Test — Admin Portal</h2>
        </div>
        <form onSubmit={handleTest} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Test Message</label>
            <div className="flex gap-2">
              <input
                value={testMsg}
                onChange={e => setTestMsg(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition"
                placeholder="Type a test message…"
                disabled={testing}
              />
              <button
                type="submit"
                disabled={testing || !testMsg.trim() || !(status?.configured)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition"
              >
                {testing
                  ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Testing…</>
                  : 'Send Test'}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              testResult.success
                ? 'border-green-200 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {testResult.success ? (
                <div>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> AI Response
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">{testResult.reply}</p>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{testResult.error}</span>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Recent AI interactions */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600">
              <Bot className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent AI Conversations</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Last 20 interactions</span>
            <button
              onClick={loadLogs}
              disabled={logsLoading}
              className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${logsLoading ? 'animate-spin' : ''}`} /> Reload
            </button>
          </div>
        </div>

        {logsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">No AI conversations recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Interactions will appear here once users start chatting with the AI assistant</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map(l => {
              const portal = String(l.metadata?.['portal'] ?? 'PUBLIC');
              const msgLen = l.metadata?.['messageLength'] != null ? Number(l.metadata['messageLength']) : null;
              const portalColor = PORTAL_COLORS[portal] ?? PORTAL_COLORS['PUBLIC'];
              return (
                <div key={l.id} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 px-4 py-3">
                  <Bot className="h-4 w-4 text-violet-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${portalColor}`}>
                        {portal}
                      </span>
                      {l.user && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <User className="h-3 w-3" />
                          {l.user.name}
                        </span>
                      )}
                      {msgLen !== null && (
                        <span className="text-xs text-slate-400">{msgLen} chars</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{fmtDateTime(l.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAiSettingsPage;
