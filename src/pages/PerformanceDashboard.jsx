import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  DollarSign, TrendingUp, CheckCircle2, Clock, Gavel,
  BarChart2, ArrowUpRight, ArrowDownRight, Target, Lightbulb,
  Star, Users, Activity, ChevronRight
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import SellerGate from '@/components/seller/SellerGate';

export default function PerformanceDashboard() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: auctions = [] } = useQuery({
    queryKey: ['perfAuctions', user?.email],
    queryFn: () => base44.entities.Auction.filter({ created_by: user.email }, '-created_date', 500),
    enabled: !!user?.email,
  });

  const { data: allBids = [] } = useQuery({
    queryKey: ['perfBids'],
    queryFn: () => base44.entities.Bid.list('-created_date', 5000),
    enabled: !!user?.email,
  });

  const { data: views = [] } = useQuery({
    queryKey: ['perfViews', user?.email],
    queryFn: () => base44.entities.AuctionView.filter({ seller_email: user.email }, '-created_date', 5000),
    enabled: !!user?.email,
  });

  const myAuctionIds = useMemo(() => new Set(auctions.map(a => a.id)), [auctions]);
  const myBids = useMemo(() => allBids.filter(b => myAuctionIds.has(b.auction_id)), [allBids, myAuctionIds]);

  const cutoff = useMemo(() => {
    if (timeRange === '7d') return subDays(new Date(), 7);
    if (timeRange === '30d') return subDays(new Date(), 30);
    return subDays(new Date(), 90);
  }, [timeRange]);

  const filteredAuctions = useMemo(() => auctions.filter(a => new Date(a.created_date) >= cutoff), [auctions, cutoff]);

  // Core KPIs
  const kpis = useMemo(() => {
    const sold = filteredAuctions.filter(a => a.status === 'paid');
    const ended = filteredAuctions.filter(a => ['ended', 'cancelled', 'paid', 'pending_payment'].includes(a.status));
    const active = auctions.filter(a => a.status === 'active' && new Date(a.end_time) > new Date());
    const revenue = sold.reduce((s, a) => s + (a.current_bid || a.starting_price || 0), 0);
    const pendingRevenue = filteredAuctions.filter(a => a.status === 'pending_payment')
      .reduce((s, a) => s + (a.current_bid || a.starting_price || 0), 0);
    const successRate = ended.length > 0 ? ((sold.length / ended.length) * 100).toFixed(1) : 0;
    const avgFinalPrice = sold.length > 0 ? (revenue / sold.length).toFixed(0) : 0;
    const totalBids = filteredAuctions.reduce((s, a) => s + (a.bid_count || 0), 0);
    const avgBids = filteredAuctions.length > 0 ? (totalBids / filteredAuctions.length).toFixed(1) : 0;
    return { sold, ended, active, revenue, pendingRevenue, successRate, avgFinalPrice, totalBids, avgBids };
  }, [filteredAuctions, auctions]);

  // Revenue over time (monthly buckets)
  const revenueOverTime = useMemo(() => {
    const months = 6;
    return Array.from({ length: months }, (_, i) => {
      const d = subMonths(new Date(), months - 1 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthSold = auctions.filter(a =>
        a.status === 'paid' && new Date(a.payment_date || a.updated_date) >= start && new Date(a.payment_date || a.updated_date) <= end
      );
      const monthPending = auctions.filter(a =>
        a.status === 'pending_payment' && new Date(a.updated_date) >= start && new Date(a.updated_date) <= end
      );
      return {
        month: format(d, 'MMM yy'),
        revenue: monthSold.reduce((s, a) => s + (a.current_bid || 0), 0),
        pending: monthPending.reduce((s, a) => s + (a.current_bid || 0), 0),
        listings: auctions.filter(a => new Date(a.created_date) >= start && new Date(a.created_date) <= end).length,
      };
    });
  }, [auctions]);

  // Bid activity over time
  const bidsOverTime = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const buckets = days <= 30 ? days : 12; // weekly buckets for 90d
    return Array.from({ length: buckets }, (_, i) => {
      let label, start, end;
      if (days <= 30) {
        const day = subDays(new Date(), days - 1 - i);
        label = format(day, 'MMM d');
        start = subDays(new Date(), days - i);
        end = subDays(new Date(), days - 1 - i);
      } else {
        start = subDays(new Date(), 91 - i * 7);
        end = subDays(new Date(), 91 - (i + 1) * 7);
        label = format(start, 'MMM d');
      }
      const count = myBids.filter(b => {
        const bd = new Date(b.created_date);
        return bd >= end && bd <= start;
      }).length;
      return { date: label, bids: count };
    });
  }, [myBids, timeRange]);

  // Success rate over months
  const successOverTime = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const periodAuctions = auctions.filter(a => {
        const ed = new Date(a.end_time);
        return ed >= start && ed <= end && ['paid', 'ended', 'pending_payment', 'cancelled'].includes(a.status);
      });
      const periodSold = periodAuctions.filter(a => a.status === 'paid').length;
      const rate = periodAuctions.length > 0 ? parseFloat(((periodSold / periodAuctions.length) * 100).toFixed(1)) : null;
      return { month: format(d, 'MMM yy'), rate, total: periodAuctions.length };
    });
  }, [auctions]);

  // Category performance
  const categoryPerf = useMemo(() => {
    const map = {};
    auctions.forEach(a => {
      const cat = a.category || 'other';
      if (!map[cat]) map[cat] = { listings: 0, sold: 0, revenue: 0, bids: 0 };
      map[cat].listings++;
      if (a.status === 'paid') { map[cat].sold++; map[cat].revenue += (a.current_bid || 0); }
      map[cat].bids += (a.bid_count || 0);
    });
    return Object.entries(map).map(([cat, d]) => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      ...d,
      successRate: d.listings > 0 ? parseFloat(((d.sold / d.listings) * 100).toFixed(1)) : 0,
      avgBids: d.listings > 0 ? parseFloat((d.bids / d.listings).toFixed(1)) : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [auctions]);

  // Optimization tips
  const tips = useMemo(() => {
    const t = [];
    if (parseFloat(kpis.successRate) < 40) t.push({ icon: Target, color: 'text-red-400', text: 'Your success rate is below 40%. Try lowering starting prices or improving listing quality.' });
    if (parseFloat(kpis.avgBids) < 3) t.push({ icon: Users, color: 'text-amber-400', text: `Average bids per auction is low (${kpis.avgBids}). Adding more images and detailed descriptions can attract more bidders.` });
    const bestCat = categoryPerf[0];
    if (bestCat) t.push({ icon: Star, color: 'text-yellow-400', text: `"${bestCat.category}" is your top-earning category. Consider listing more items there.` });
    if (kpis.active.length === 0) t.push({ icon: Activity, color: 'text-blue-400', text: 'You have no active listings right now. Start a new auction to keep momentum.' });
    if (t.length === 0) t.push({ icon: CheckCircle2, color: 'text-green-400', text: 'Great performance! Keep listing consistently to maintain your momentum.' });
    return t;
  }, [kpis, categoryPerf]);

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
    </div>
  );

  if (!user.is_seller) return <SellerGate />;

  const kpiCards = [
    { label: 'Total Revenue', value: `$${kpis.revenue.toLocaleString()}`, sub: `+$${kpis.pendingRevenue.toLocaleString()} pending`, icon: DollarSign, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Active Listings', value: kpis.active.length, sub: `${filteredAuctions.length} created in period`, icon: TrendingUp, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Success Rate', value: `${kpis.successRate}%`, sub: `${kpis.sold.length} of ${kpis.ended.length} ended`, icon: CheckCircle2, gradient: 'from-green-500 to-emerald-500' },
    { label: 'Avg Final Price', value: `$${Number(kpis.avgFinalPrice).toLocaleString()}`, sub: `${kpis.totalBids} total bids`, icon: Gavel, gradient: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              Performance Dashboard
            </h1>
            <p className="text-slate-400 mt-1 ml-13">Track your auction performance and optimize your strategy</p>
          </div>
          <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-lg p-1">
            {[['7d','7 Days'],['30d','30 Days'],['90d','90 Days']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTimeRange(val)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  timeRange === val
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(({ label, value, sub, icon: Icon, gradient }) => (
            <Card key={label} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <CardContent className="p-5">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm font-medium text-slate-300 mt-0.5">{label}</p>
                <p className="text-xs text-slate-500 mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue & Listings Over Time */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Revenue — Last 6 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueOverTime}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(v, name) => [`$${v.toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Pending']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="pending" stroke="#fb923c" strokeWidth={1.5} strokeDasharray="4 2" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> Collected revenue</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 border-dashed inline-block" /> Pending payment</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                Bid Activity — {timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : '90 Days'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bidsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} interval={timeRange === '90d' ? 1 : 'preserveStartEnd'} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#a78bfa' }}
                  />
                  <Bar dataKey="bids" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Success Rate Trend */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Success Rate Trend — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={successOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(v, _, props) => [`${v}%  (${props.payload.total} auctions)`, 'Success Rate']}
                />
                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance Table */}
        {categoryPerf.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/50 text-left">
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium text-right">Listings</th>
                      <th className="pb-3 font-medium text-right">Sold</th>
                      <th className="pb-3 font-medium text-right">Success %</th>
                      <th className="pb-3 font-medium text-right">Revenue</th>
                      <th className="pb-3 font-medium text-right">Avg Bids</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {categoryPerf.map(c => (
                      <tr key={c.category} className="text-slate-300">
                        <td className="py-3 font-medium text-white capitalize">{c.category}</td>
                        <td className="py-3 text-right">{c.listings}</td>
                        <td className="py-3 text-right">{c.sold}</td>
                        <td className="py-3 text-right">
                          <span className={`font-semibold ${c.successRate >= 50 ? 'text-green-400' : c.successRate >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
                            {c.successRate}%
                          </span>
                        </td>
                        <td className="py-3 text-right text-amber-400 font-semibold">${c.revenue.toLocaleString()}</td>
                        <td className="py-3 text-right">{c.avgBids}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Optimization Tips */}
        <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/40">
                  <tip.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${tip.color}`} />
                  <p className="text-sm text-slate-300">{tip.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          <Link to="/SellerDashboard">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2">
              Manage Listings <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/Auctions">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2">
              Browse Auctions <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}