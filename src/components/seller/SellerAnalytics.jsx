import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Eye, MousePointerClick, TrendingUp, BarChart2 } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const CATEGORY_COLORS = {
  electronics: '#3b82f6',
  fashion: '#ec4899',
  art: '#a855f7',
  collectibles: '#f59e0b',
  home: '#22c55e',
  vehicles: '#ef4444',
  jewelry: '#f97316',
  sports: '#06b6d4',
  other: '#64748b',
};

export default function SellerAnalytics({ sellerEmail, auctions }) {
  const { data: views = [] } = useQuery({
    queryKey: ['auctionViews', sellerEmail],
    queryFn: () => base44.entities.AuctionView.filter({ seller_email: sellerEmail }, '-created_date', 2000),
    enabled: !!sellerEmail,
  });

  const { data: allBids = [] } = useQuery({
    queryKey: ['allBidsAnalytics', sellerEmail],
    queryFn: () => base44.entities.Bid.list('-created_date', 2000),
    enabled: !!sellerEmail,
  });

  const myAuctionIds = useMemo(() => new Set(auctions.map(a => a.id)), [auctions]);
  const myBids = useMemo(() => allBids.filter(b => myAuctionIds.has(b.auction_id)), [allBids, myAuctionIds]);

  // Summary stats
  const totalViews = views.length;
  const totalClicks = views.filter(v => v.clicked_bid).length;
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0;
  const avgBidsPerAuction = auctions.length > 0
    ? (auctions.reduce((s, a) => s + (a.bid_count || 0), 0) / auctions.length).toFixed(1)
    : 0;

  // Views per auction (top 8)
  const viewsByAuction = useMemo(() => {
    const map = {};
    views.forEach(v => {
      map[v.auction_id] = (map[v.auction_id] || 0) + 1;
    });
    return Object.entries(map)
      .map(([id, count]) => {
        const auction = auctions.find(a => a.id === id);
        return { name: auction?.title?.slice(0, 22) + (auction?.title?.length > 22 ? '…' : '') || id, views: count };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [views, auctions]);

  // Views over last 14 days
  const viewsOverTime = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const dayStr = format(day, 'MMM d');
      const count = views.filter(v => {
        const d = new Date(v.created_date);
        return format(d, 'MMM d') === dayStr;
      }).length;
      return { date: dayStr, views: count };
    });
  }, [views]);

  // CTR by category
  const ctrByCategory = useMemo(() => {
    const map = {};
    views.forEach(v => {
      const cat = v.category || 'other';
      if (!map[cat]) map[cat] = { views: 0, clicks: 0 };
      map[cat].views++;
      if (v.clicked_bid) map[cat].clicks++;
    });
    return Object.entries(map).map(([cat, d]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      ctr: d.views > 0 ? parseFloat(((d.clicks / d.views) * 100).toFixed(1)) : 0,
      views: d.views,
    })).sort((a, b) => b.views - a.views);
  }, [views]);

  // Price trends by category (avg final price of ended auctions)
  const priceTrendByCategory = useMemo(() => {
    const map = {};
    auctions
      .filter(a => a.status === 'ended' && a.current_bid)
      .forEach(a => {
        const cat = a.category || 'other';
        if (!map[cat]) map[cat] = [];
        map[cat].push(a.current_bid);
      });
    return Object.entries(map).map(([cat, prices]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      avg: parseFloat((prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2)),
      auctions: prices.length,
      fill: CATEGORY_COLORS[cat] || '#64748b',
    })).sort((a, b) => b.avg - a.avg);
  }, [auctions]);

  // Bid activity over 14 days
  const bidsOverTime = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const dayStr = format(day, 'MMM d');
      const count = myBids.filter(b => format(new Date(b.created_date), 'MMM d') === dayStr).length;
      return { date: dayStr, bids: count };
    });
  }, [myBids]);

  const summaryCards = [
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'from-blue-500 to-cyan-500' },
    { label: 'Bid Click-throughs', value: totalClicks.toLocaleString(), icon: MousePointerClick, color: 'from-purple-500 to-pink-500' },
    { label: 'Click-through Rate', value: `${ctr}%`, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
    { label: 'Avg Bids / Auction', value: avgBidsPerAuction, icon: BarChart2, color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-slate-400 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views & Bids Over Time */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Views — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={viewsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#38bdf8' }} />
                <Line type="monotone" dataKey="views" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Bids Received — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bidsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#a78bfa' }} />
                <Bar dataKey="bids" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Auctions by Views */}
      {viewsByAuction.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Top Auctions by Views</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={viewsByAuction} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={130} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#f59e0b' }} />
                <Bar dataKey="views" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category CTR & Price Trends */}
      <div className="grid lg:grid-cols-2 gap-6">
        {ctrByCategory.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base">Click-through Rate by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ctrByCategory.map(({ name, ctr, views }) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-slate-300 text-sm w-24 truncate">{name}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${Math.min(ctr * 2, 100)}%` }}
                      />
                    </div>
                    <Badge className="bg-slate-700 text-slate-300 text-xs">{ctr}%</Badge>
                    <span className="text-slate-500 text-xs w-16 text-right">{views} views</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {priceTrendByCategory.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base">Avg Final Price by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priceTrendByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(val) => [`$${val}`, 'Avg Price']}
                  />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {priceTrendByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {views.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-10 text-center">
            <Eye className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">No view data yet — analytics populate as buyers browse your auctions.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}