import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Bell, X, Gavel, Clock, Package, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const TYPE_CONFIG = {
  outbid: { icon: Gavel, color: "text-red-400", bg: "bg-red-400/10" },
  ending_soon: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
  shipment_update: { icon: Package, color: "text-blue-400", bg: "bg-blue-400/10" },
  auction_won: { icon: Trophy, color: "text-green-400", bg: "bg-green-400/10" },
};

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userEmail) return;
    loadNotifications();
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_email === userEmail) {
        setNotifications(prev => [event.data, ...prev]);

        const n = event.data;
        if (n.type === 'outbid' && n.auction_id) {
          toast(n.title, {
            description: n.message,
            duration: 8000,
            action: {
              label: 'Bid Again →',
              onClick: () => navigate(`/AuctionDetail?id=${n.auction_id}`),
            },
            icon: <Gavel className="w-4 h-4 text-red-400" />,
          });
        }
      } else if (event.type === 'update') {
        setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
      } else if (event.type === 'delete') {
        setNotifications(prev => prev.filter(n => n.id !== event.id));
      }
    });
    return unsub;
  }, [userEmail]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifications = async () => {
    const data = await base44.entities.Notification.filter({ user_email: userEmail }, '-created_date', 30);
    setNotifications(data);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (n) => {
    if (n.is_read) return;
    await base44.entities.Notification.update(n.id, { is_read: true });
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  };

  const dismiss = async (e, id) => {
    e.stopPropagation();
    await base44.entities.Notification.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-white font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="w-8 h-8 text-slate-600" />
                <p className="text-slate-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.outbid;
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`flex gap-3 px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer ${!n.is_read ? 'bg-slate-800/30' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center mt-0.5`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-tight ${n.is_read ? 'text-slate-300' : 'text-white'}`}>
                          {n.title}
                        </p>
                        <button
                          onClick={(e) => dismiss(e, n.id)}
                          className="flex-shrink-0 text-slate-600 hover:text-slate-400 mt-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                      {n.auction_id && (
                        <Link
                          to={`/AuctionDetail?id=${n.auction_id}`}
                          onClick={() => setOpen(false)}
                          className="text-xs text-amber-400 hover:text-amber-300 mt-1 inline-block"
                        >
                          View auction →
                        </Link>
                      )}
                      <p className="text-[11px] text-slate-600 mt-1">
                        {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}