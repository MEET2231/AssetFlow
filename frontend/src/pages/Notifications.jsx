// Notifications & Activity — polished UI with type-specific icons, colors, filtering, and live polling
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api';
import { Icon, ICONS, PageHeader, Spinner, EmptyState } from '../components/ui';

/* ── Notification type metadata ────────────────────────────── */

const NOTIF_META = {
  asset_assigned: {
    label: 'Asset Assigned',
    icon: ICONS.box,
    cls: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    dot: 'bg-indigo-500',
    category: 'assets',
  },
  maintenance_approved: {
    label: 'Maintenance Approved',
    icon: ICONS.check,
    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    dot: 'bg-emerald-500',
    category: 'maintenance',
  },
  maintenance_rejected: {
    label: 'Maintenance Rejected',
    icon: ICONS.close,
    cls: 'bg-rose-50 text-rose-600 border-rose-200',
    dot: 'bg-rose-500',
    category: 'maintenance',
  },
  maintenance_assigned: {
    label: 'Maintenance Assigned',
    icon: ICONS.wrench,
    cls: 'bg-amber-50 text-amber-600 border-amber-200',
    dot: 'bg-amber-500',
    category: 'maintenance',
  },
  maintenance_in_progress: {
    label: 'Maintenance In Progress',
    icon: ICONS.wrench,
    cls: 'bg-amber-50 text-amber-600 border-amber-200',
    dot: 'bg-amber-500',
    category: 'maintenance',
  },
  maintenance_resolved: {
    label: 'Maintenance Resolved',
    icon: ICONS.checkCircle,
    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    dot: 'bg-emerald-500',
    category: 'maintenance',
  },
  booking_requested: {
    label: 'Booking Requested',
    icon: ICONS.calendar,
    cls: 'bg-sky-50 text-sky-600 border-sky-200',
    dot: 'bg-sky-500',
    category: 'bookings',
  },
  booking_confirmed: {
    label: 'Booking Confirmed',
    icon: ICONS.checkCircle,
    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    dot: 'bg-emerald-500',
    category: 'bookings',
  },
  booking_rejected: {
    label: 'Booking Rejected',
    icon: ICONS.close,
    cls: 'bg-rose-50 text-rose-600 border-rose-200',
    dot: 'bg-rose-500',
    category: 'bookings',
  },
  booking_cancelled: {
    label: 'Booking Cancelled',
    icon: ICONS.close,
    cls: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-400',
    category: 'bookings',
  },
  booking_reminder: {
    label: 'Booking Reminder',
    icon: ICONS.clock,
    cls: 'bg-violet-50 text-violet-600 border-violet-200',
    dot: 'bg-violet-500',
    category: 'bookings',
  },
  transfer_approved: {
    label: 'Transfer Approved',
    icon: ICONS.transfer,
    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    dot: 'bg-emerald-500',
    category: 'transfers',
  },
  transfer_rejected: {
    label: 'Transfer Rejected',
    icon: ICONS.transfer,
    cls: 'bg-rose-50 text-rose-600 border-rose-200',
    dot: 'bg-rose-500',
    category: 'transfers',
  },
  overdue_return: {
    label: 'Overdue Return',
    icon: ICONS.warning,
    cls: 'bg-rose-50 text-rose-600 border-rose-200',
    dot: 'bg-rose-500',
    category: 'assets',
  },
  audit_assigned: {
    label: 'Audit Assigned',
    icon: ICONS.clipboard,
    cls: 'bg-sky-50 text-sky-600 border-sky-200',
    dot: 'bg-sky-500',
    category: 'audits',
  },
  audit_discrepancy: {
    label: 'Audit Discrepancy',
    icon: ICONS.warning,
    cls: 'bg-rose-50 text-rose-600 border-rose-200',
    dot: 'bg-rose-500',
    category: 'audits',
  },
  role_changed: {
    label: 'Role Changed',
    icon: ICONS.users,
    cls: 'bg-violet-50 text-violet-600 border-violet-200',
    dot: 'bg-violet-500',
    category: 'system',
  },
};

const FALLBACK_META = {
  label: 'Notification',
  icon: ICONS.bell,
  cls: 'bg-slate-100 text-slate-500 border-slate-200',
  dot: 'bg-slate-400',
  category: 'system',
};

const FILTER_TABS = [
  { key: 'all',         label: 'All' },
  { key: 'assets',      label: 'Assets' },
  { key: 'bookings',    label: 'Bookings' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'transfers',   label: 'Transfers' },
  { key: 'audits',      label: 'Audits' },
  { key: 'system',      label: 'System' },
];

/* ── Time formatting ───────────────────────────────────────── */

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ── Notification card ─────────────────────────────────────── */

function NotificationCard({ notif, onMarkRead }) {
  const meta = NOTIF_META[notif.type] || FALLBACK_META;
  const isUnread = !notif.read;

  return (
    <div
      className={`group relative flex items-start gap-3.5 px-5 py-4 transition-all duration-200 ${
        isUnread
          ? 'bg-white hover:bg-slate-50'
          : 'bg-slate-50/50 hover:bg-slate-50'
      }`}
    >
      {/* Unread indicator */}
      {isUnread && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
      )}

      {/* Icon */}
      <div className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${meta.cls}`}>
        <Icon path={meta.icon} className="h-[17px] w-[17px]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
              isUnread ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <p className={`text-sm leading-relaxed mt-0.5 ${
              isUnread ? 'text-slate-800 font-medium' : 'text-slate-500'
            }`}>
              {notif.message}
            </p>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">{timeAgo(notif.created_at)}</span>
        </div>
      </div>

      {/* Mark read button */}
      {isUnread && (
        <button
          onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
          title="Mark as read"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
        >
          <Icon path={ICONS.check} className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Activity log row ──────────────────────────────────────── */

function ActivityRow({ log }) {
  // Map action prefixes to visual data
  const actionMeta = {
    'allocation.':  { icon: ICONS.transfer, cls: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    'transfer.':    { icon: ICONS.transfer, cls: 'bg-purple-50 text-purple-600 border-purple-200' },
    'booking.':     { icon: ICONS.calendar, cls: 'bg-sky-50 text-sky-600 border-sky-200' },
    'maintenance.': { icon: ICONS.wrench,   cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    'audit.':       { icon: ICONS.clipboard, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    'asset.':       { icon: ICONS.box,       cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  };
  const prefix = Object.keys(actionMeta).find((p) => log.action.startsWith(p));
  const meta = actionMeta[prefix] || { icon: ICONS.sparkle, cls: 'bg-slate-100 text-slate-500 border-slate-200' };

  return (
    <div className="flex items-start gap-3.5 px-5 py-3.5">
      <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${meta.cls}`}>
        <Icon path={meta.icon} className="h-[15px] w-[15px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">
          <span className="font-semibold">{log.user_name || 'System'}</span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="text-slate-500">{log.action.replace(/\./g, ' → ')}</span>
          {log.details && (
            <span className="text-slate-400 ml-1.5">— {log.details}</span>
          )}
        </p>
      </div>
      <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(log.created_at)}</span>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('notifications');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [notifs, acts] = await Promise.all([
        api('/notifications'),
        api('/activity'),
      ]);
      setNotifications(notifs);
      setActivity(acts);
    } catch (e) {
      // silently fail on polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Also trigger overdue/reminder checks on page load
    api('/notifications/check-overdue', { method: 'POST' }).catch(() => {});
    api('/notifications/booking-reminders', { method: 'POST' }).catch(() => {});
  }, [load]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    pollRef.current = setInterval(load, 30000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const markAll = async () => {
    await api('/notifications/read-all', { method: 'POST' });
    load();
  };

  const markOne = async (id) => {
    await api(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Filter notifications
  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => {
        const meta = NOTIF_META[n.type] || FALLBACK_META;
        return meta.category === filter;
      });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Notifications & Activity"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
      >
        {tab === 'notifications' && unreadCount > 0 && (
          <button className="btn-secondary" onClick={markAll}>
            <Icon path={ICONS.check} className="h-3.5 w-3.5 mr-1.5 inline" />
            Mark all read
          </button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {['notifications', 'activity'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all cursor-pointer ${
              tab === t
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'notifications' ? (
              <span className="flex items-center gap-1.5">
                <Icon path={ICONS.bell} className="h-[15px] w-[15px]" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold leading-none">
                    {unreadCount}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Icon path={ICONS.clock} className="h-[15px] w-[15px]" />
                Activity Log
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <>
          {/* Category filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_TABS.map((f) => {
              const count = f.key === 'all'
                ? notifications.length
                : notifications.filter((n) => (NOTIF_META[n.type] || FALLBACK_META).category === f.key).length;
              if (f.key !== 'all' && count === 0) return null;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filter === f.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {f.label}
                  <span className={`ml-1.5 ${filter === f.key ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Notification list */}
          <div className="card p-0 overflow-hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <EmptyState
                icon={ICONS.bell}
                title="No notifications"
                sub={filter !== 'all' ? 'No notifications in this category.' : 'You\'re all caught up! New notifications will appear here.'}
              />
            ) : (
              filtered.map((n) => (
                <NotificationCard key={n.id} notif={n} onMarkRead={markOne} />
              ))
            )}
          </div>
        </>
      )}

      {/* Activity tab */}
      {tab === 'activity' && (
        <div className="card p-0 overflow-hidden divide-y divide-slate-100">
          {activity.length === 0 ? (
            <EmptyState
              icon={ICONS.clock}
              title="No activity yet"
              sub="Actions taken across the system will appear here."
            />
          ) : (
            activity.map((l) => <ActivityRow key={l.id} log={l} />)
          )}
        </div>
      )}
    </div>
  );
}
