import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, Package, Clock, CheckCircle,
  Gavel, Eye, BarChart2, ArrowLeft, Award, Target, Zap, Calendar,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import SellerGate from "@/components/seller/SellerGate";

const COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];
const CATEGORY_COLORS = {
  electronics: '#3b82f6', fashion: '#ec4899', art: '#a855f7',
  collectibles: '#f59e0b', home: '#22c55e', vehicles: '#ef4444',
  jewelry: '#f97316', sports: '#06b6d4', other: '#64748b',
};

const PLATFORM_FEE = 0.08;

function StatCard({ label, value, sub, icon: Icon, gradient, trend, trendValue }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trendValue !== undefined && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              {trendValue}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-white truncate">{value}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-lg font-semibold text-white mb-4">{children}</h2>;
}

export default function SellerAnalyticsDashboard() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('90d');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: myAuctions = [] } = useQuery({
    queryKey: ['saAuctions', user?.email],
    queryFn: () => base44.entities.Auction.filter({ created_by: user.email }, '-created_date', 1000),
    enabled: !!user?.email,
  });

  const { data: allBids = [] } = useQuery({
    queryKey: ['saBids'],
    queryFn: () => base44.entities.Bid.list('-created_date', 2000),
    enabled: !!user?.email,
  });

  const { data: views = [] } = useQuery({
    queryKey: ['saViews', user?.email],
    queryFn: () => base44.entities.AuctionView.filter({ seller_email: user.email }, '-created_date', 5000),
    enabled: !!user?.email,
  });

  const { data: payoutRequests = [] } = useQuery({
    queryKey: ['saPayouts', user?.email],
    queryFn: () => base44.entities.PayoutRequest.filter({ seller_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  // Derived data
  const myAuctionIds = useMemo(() => new Set(myAuctions.map(a => a.id)), [myAuctions]);
  const myBids = useMemo(() => allBids.filter(b => myAuctionIds.has(b.auction_id)), [allBids, myAuctionIds]);

  const cutoff = useMemo(() => {
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    return subDays(new Date(), days);
  }, [timeRange]);

  const activeAuctions = myAuctions.filter(a => a.status === 'active' && new Date(a.end_time) > new Date());
  const soldAuctions = myAuctions.filter(a => a.status === 'paid');
  const pendingAuctions = myAuctions.filter(a => a.status === 'pending_payment');
  const endedAuctions = myAuctions.filter(a => a.status === 'ended');

  const totalRevenue = soldAuctions.reduce((s, a) => s + (a.current_bid || 0), 0);
  const netRevenue = totalRevenue * (1 - PLATFORM_FEE);
  const pendingRevenue = pendingAuctions.reduce((s, a) => s + (a.current_bid || 0), 0);
  const totalPaidOut = payoutRequests.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const availableBalance = netRevenue - totalPaidOut;

  const totalBids = myBids.length;
  const avgBidsPerAuction = myAuctions.length > 0 ? (myBids.length / myAuctions.length).toFixed(1) : 0;
  const winRate = myAuctions.filter(a => a.current_bid > 0 && (a.status === 'ended' || a.status === 'paid' || a.status === 'pending_payment')).length;
  const totalViews = views.length;
  const bidClickRate = totalViews > 0 ? ((views.filter(v => v.clicked_bid).length / totalViews) * 100).toFixed(1) : 0;

  // Revenue over time (monthly for 12m, weekly for 90d, daily for 30d)
  const revenueOverTime = useMemo(() => {
    if (timeRange === '365d') {
      const months = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() });
      return months.map(month => {
        const label = format(month, 'MMM yy');
        const ms = startOfMonth(month).getTime();
        const me = endOfMonth(month).getTime();
        const rev = soldAuctions
          .filter(a => { const d = new Date(a.payment_date || a.updated_date).getTime(); return d >= ms && d <= me; })
          .reduce((s, a) => s + (a.current_bid || 0), 0);
        return { date: label, revenue: parseFloat((rev * (1 - PLATFORM_FEE)).toFixed(2)) };
      });
    }
    const days = timeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const day = subDays(new Date(), days - 1 - i);
      const dayStr = format(day, 'MMM d');
      const rev = soldAuctions
        .filter(a => format(new Date(a.payment_date || a.updated_date), 'MMM d') === dayStr)
        .reduce((s, a) => s + (a.current_bid || 0), 0);
      return { date: dayStr, revenue: parseFloat((rev * (1 - PLATFORM_FEE)).toFixed(2)) };
    }).filter((_, i, arr) => timeRange === '30d' || i % 3 === 0 || i === arr.length - 1);
  }, [soldAuctions, timeRange]);

  // Bids over time
  const bidsOverTime = useMemo(() => {
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    if (timeRange === '365d') {
      const months = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() });
      return months.map(month => {
        const label = format(month, 'MMM yy');
        const ms = startOfMonth(month).getTime();
        const me = endOfMonth(month).getTime();
        const count = myBids.filter(b => { const d = new Date(b.created_date).getTime(); return d >= ms && d <= me; }).length;
        return { date: label, bids: count };
      });
    }
    return Array.from({ length: days }, (_, i) => {
      const day = subDays(new Date(), days - 1 - i);
      const dayStr = format(day, 'MMM d');
      return { date: dayStr, bids: myBids.filter(b => format(new Date(b.created_date), 'MMM d') === dayStr).length };
    }).filter((_, i) => timeRange === '30d' || i % 3 === 0);
  }, [myBids, timeRange]);

  // Category breakdown (sold)
  const categoryBreakdown = useMemo(() => {
    const map = {};
    soldAuctions.forEach(a => {
      const cat = a.category || 'other';
      if (!map[cat]) map[cat] = { count: 0, revenue: 0 };
      map[cat].count++;
      map[cat].revenue += (a.current_bid || 0);
    });
    return Object.entries(map)
      .map(([cat, d]) => ({ name: cat.charAt(0).toUpperCase() + cat.slice(1), count: d.count, revenue: parseFloat((d.revenue * (1 - PLATFORM_FEE)).toFixed(2)), fill: CATEGORY_COLORS[cat] || '#64748b' }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [soldAuctions]);

  // Top performing auctions (by final bid)
  const topAuctions = useMemo(() =>
    [...myAuctions]
      .filter(a => a.current_bid && (a.status === 'paid' || a.status === 'ended' || a.status === 'pending_payment'))
      .sort((a, b) => (b.current_bid || 0) - (a.current_bid || 0))
      .slice(0, 8)
  , [myAuctions]);

  // Active listings sorted by end time
  const sortedActive = useMemo(() =>
    [...activeAuctions].sort((a, b) => new Date(a.end_time) - new Date(b.end_time))
  , [activeAuctions]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!user.is_seller) return <SellerGate />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link to="/SellerDashboard">
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BarChart2 className="w-8 h-8 text-amber-400" />
                Analytics Dashboard
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">Revenue, listings, and performance metrics for <span className="text-amber-400">{user.store_name || user.full_name}</span></p>
            </div>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
            {[{ label: '30D', value: '30d' }, { label: '90D', value: '90d' }, { label: '1Y', value: '365d' }].map(r => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  timeRange === r.value
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub={`$${netRevenue.toLocaleString()} after fees`} icon={DollarSign} gradient="from-amber-500 to-orange-500" />
          <StatCard label="Available Balance" value={`$${Math.max(0, availableBalance).toLocaleString()}`} sub={`$${totalPaidOut.toLocaleString()} paid out`} icon={Award} gradient="from-green-500 to-emerald-500" />
          <StatCard label="Auctions Sold" value={soldAuctions.length} sub={`${pendingAuctions.length} pending payment`} icon={CheckCircle} gradient="from-blue-500 to-cyan-500" />
          <StatCard label="Pending Revenue" value={`$${pendingRevenue.toLocaleString()}`} sub={`${pendingAuctions.length} auction${pendingAuctions.length !== 1 ? 's' : ''}`} icon={Clock} gradient="from-purple-500 to-pink-500" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Listings" value={activeAuctions.length} sub="live right now" icon={Zap} gradient="from-amber-400 to-yellow-500" />
          <StatCard label="Total Bids Received" value={totalBids.toLocaleString()} sub={`${avgBidsPerAuction} avg per auction`} icon={Gavel} gradient="from-violet-500 to-purple-500" />
          <StatCard label="Total Views" value={totalViews.toLocaleString()} sub={`${bidClickRate}% bid click rate`} icon={Eye} gradient="from-sky-500 to-blue-500" />
          <StatCard label="Auctions Won by Buyers" value={winRate} sub="with final bids" icon={Target} gradient="from-rose-500 to-red-500" />
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 h-auto flex flex-wrap gap-1">
            {[
              { value: 'revenue', label: 'Revenue', icon: DollarSign },
              { value: 'bids', label: 'Bid Activity', icon: Gavel },
              { value: 'categories', label: 'Categories', icon: Package },
              { value: 'listings', label: 'Active Listings', icon: Zap },
              { value: 'history', label: 'Auction History', icon: Calendar },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
              >
                <Icon className="w-4 h-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="bg-slate-800/50 border-slate-700/50 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center justify-between">
                    Net Revenue Over Time
                    <span className="text-xs text-slate-400 font-normal">After {(PLATFORM_FEE * 100).toFixed(0)}% platform fee</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenueOverTime}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} formatter={v => [`$${v.toLocaleString()}`, 'Net Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#revGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {[
                    { label: 'Gross Revenue', value: totalRevenue, color: 'text-white' },
                    { label: `Platform Fee (${(PLATFORM_FEE * 100).toFixed(0)}%)`, value: -(totalRevenue * PLATFORM_FEE), color: 'text-red-400' },
                    { label: 'Net Revenue', value: netRevenue, color: 'text-amber-400', bold: true },
                    { label: 'Paid Out', value: -totalPaidOut, color: 'text-slate-400' },
                    { label: 'Available', value: Math.max(0, availableBalance), color: 'text-green-400', bold: true },
                  ].map(r => (
                    <div key={r.label} className={`flex justify-between items-center ${r.bold ? 'pt-2 border-t border-slate-700' : ''}`}>
                      <span className="text-slate-400 text-sm">{r.label}</span>
                      <span className={`font-semibold text-sm ${r.color}`}>{r.value < 0 ? '-' : ''}${Math.abs(r.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="pt-3">
                    <Link to="/SellerPayouts">
                      <button className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm font-medium">
                        Manage Payouts →
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Auctions by Revenue */}
            {topAuctions.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Top Auctions by Final Bid</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topAuctions.map(a => ({ name: a.title?.slice(0, 20) + (a.title?.length > 20 ? '…' : ''), bid: a.current_bid || 0 }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={140} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={v => [`$${v.toLocaleString()}`, 'Final Bid']} />
                      <Bar dataKey="bid" radius={[0, 4, 4, 0]}>
                        {topAuctions.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="bids" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Bids Received Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={bidsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} itemStyle={{ color: '#a78bfa' }} />
                      <Bar dataKey="bids" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Bid Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {[
                    { label: 'Total Bids', value: totalBids.toLocaleString(), icon: Gavel, color: 'text-purple-400' },
                    { label: 'Avg Bids / Auction', value: avgBidsPerAuction, icon: TrendingUp, color: 'text-amber-400' },
                    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-sky-400' },
                    { label: 'Bid Click Rate', value: `${bidClickRate}%`, icon: Target, color: 'text-green-400' },
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <m.icon className={`w-4 h-4 ${m.color}`} />
                        <span className="text-slate-300 text-sm">{m.label}</span>
                      </div>
                      <span className={`font-bold ${m.color}`}>{m.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryBreakdown.length === 0 ? (
                    <div className="py-10 text-center text-slate-500">No sold auctions yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={categoryBreakdown} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {categoryBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={v => [`$${v.toLocaleString()}`, 'Net Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Category Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {categoryBreakdown.length === 0 ? (
                    <div className="py-10 text-center text-slate-500">No sold auctions yet</div>
                  ) : categoryBreakdown.map(cat => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{cat.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{cat.count} sold</span>
                          <span className="text-amber-400 font-semibold">${cat.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(cat.revenue / categoryBreakdown[0].revenue) * 100}%`, background: cat.fill }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Active Listings Tab */}
          <TabsContent value="listings" className="space-y-4">
            {sortedActive.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="py-16 text-center">
                  <Zap className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">No active listings right now</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionTitle>{sortedActive.length} Active Listing{sortedActive.length !== 1 ? 's' : ''}</SectionTitle>
                  <Link to="/SellerDashboard">
                    <button className="text-sm text-amber-400 hover:text-amber-300 transition-colors">Manage in Dashboard →</button>
                  </Link>
                </div>
                {sortedActive.map(auction => {
                  const bidsForAuction = myBids.filter(b => b.auction_id === auction.id);
                  const viewsForAuction = views.filter(v => v.auction_id === auction.id).length;
                  const timeLeft = Math.max(0, new Date(auction.end_time) - new Date());
                  const hoursLeft = (timeLeft / 3_600_000).toFixed(1);
                  const isUrgent = timeLeft < 3_600_000 * 2;
                  return (
                    <Card key={auction.id} className={`bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-colors ${isUrgent ? 'border-amber-500/40' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={auction.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"} alt={auction.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="text-white font-semibold truncate">{auction.title}</h3>
                              {isUrgent && <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 border text-xs flex-shrink-0">⏰ Ending soon</Badge>}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-slate-500 text-xs">Current Bid</p>
                                <p className="text-amber-400 font-bold">${(auction.current_bid || auction.starting_price).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-slate-500 text-xs">Bids</p>
                                <p className="text-white font-semibold">{auction.bid_count || 0}</p>
                              </div>
                              <div>
                                <p className="text-slate-500 text-xs">Views</p>
                                <p className="text-white font-semibold">{viewsForAuction}</p>
                              </div>
                              <div>
                                <p className="text-slate-500 text-xs">Time Left</p>
                                <p className={`font-semibold ${isUrgent ? 'text-amber-400' : 'text-white'}`}>{hoursLeft}h</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Auction History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Auctions', value: myAuctions.length, color: 'text-white' },
                { label: 'Sold / Paid', value: soldAuctions.length, color: 'text-green-400' },
                { label: 'Ended (No Sale)', value: endedAuctions.length, color: 'text-slate-400' },
              ].map(s => (
                <Card key={s.label} className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-4 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-slate-400 text-xs mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              {myAuctions.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="py-16 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400">No auction history yet</p>
                  </CardContent>
                </Card>
              ) : (
                [...myAuctions]
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .map(auction => {
                    const statusConfig = {
                      active: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Active' },
                      paid: { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Paid' },
                      pending_payment: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Pending' },
                      ended: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Ended' },
                      cancelled: { color: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Cancelled' },
                      scheduled: { color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Scheduled' },
                    }[auction.status] || { color: 'bg-slate-700 text-slate-400', label: auction.status };
                    return (
                      <Card key={auction.id} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={auction.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"} alt={auction.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-white font-semibold truncate">{auction.title}</span>
                                <Badge className={`${statusConfig.color} border text-xs flex-shrink-0`}>{statusConfig.label}</Badge>
                                {auction.category && <Badge className="bg-slate-700/50 text-slate-300 text-xs border-0">{auction.category}</Badge>}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-slate-500 text-xs">Starting Price</p>
                                  <p className="text-slate-300">${(auction.starting_price || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 text-xs">Final Bid</p>
                                  <p className={`font-semibold ${auction.current_bid ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {auction.current_bid ? `$${auction.current_bid.toLocaleString()}` : '—'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500 text-xs">Bids</p>
                                  <p className="text-white">{auction.bid_count || 0}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 text-xs">Date</p>
                                  <p className="text-slate-300 text-xs">{format(new Date(auction.created_date), 'MMM d, yyyy')}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}