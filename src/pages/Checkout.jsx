import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, Lock, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Checkout() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('review'); // 'review' | 'payment' | 'success'
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const auctionId = urlParams.get('auction_id');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate('/'));
  }, []);

  const { data: auction } = useQuery({
    queryKey: ['checkout-auction', auctionId],
    queryFn: () => base44.entities.Auction.filter({ id: auctionId }).then(r => r[0]),
    enabled: !!auctionId,
  });

  // Guard: only the winner can checkout
  useEffect(() => {
    if (!user || !auction) return;
    if (auction.current_bidder !== user.email) {
      toast.error("You are not the winner of this auction.");
      navigate('/Profile');
    }
    if (auction.status === 'paid') {
      setStep('success');
    }
  }, [user, auction]);

  const platformFee = auction ? parseFloat((auction.current_bid * 0.03).toFixed(2)) : 0;
  const total = auction ? parseFloat((auction.current_bid + platformFee).toFixed(2)) : 0;

  const handlePayment = async () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
      toast.error('Please fill in all card details.');
      return;
    }
    setProcessing(true);
    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 2000));
    await base44.entities.Auction.update(auctionId, {
      status: 'paid',
      payment_date: new Date().toISOString(),
    });
    setProcessing(false);
    setStep('success');
    toast.success('Payment successful! 🎉');
  };

  const formatCardNumber = (val) => {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Purchase Complete!</h1>
          <p className="text-slate-400 mb-2">You've successfully purchased</p>
          <p className="text-xl font-semibold text-amber-400 mb-6">"{auction.title}"</p>
          <p className="text-slate-500 text-sm mb-8">
            The seller has been notified and will arrange shipping shortly. Check your profile for shipment updates.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/Profile">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white">View My Winnings</Button>
            </Link>
            <Link to="/Auctions">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">Browse Auctions</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link to="/Profile">
          <Button variant="ghost" className="text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Checkout</h1>
            <p className="text-slate-400 text-sm">Complete your winning purchase</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-green-400 text-sm">
            <Lock className="w-4 h-4" />
            <span>Secure Checkout</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-700 sticky top-6">
              <CardHeader>
                <CardTitle className="text-white text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={auction.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                    alt={auction.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{auction.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">Seller: {auction.seller_name}</p>
                  {auction.end_time && (
                    <p className="text-slate-500 text-xs mt-1">Ended {format(new Date(auction.end_time), 'MMM d, yyyy')}</p>
                  )}
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">🏆 You Won!</Badge>
                <Separator className="bg-slate-700" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Winning bid</span>
                    <span className="text-white">${auction.current_bid?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Platform fee (3%)</span>
                    <span className="text-white">${platformFee.toLocaleString()}</span>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-amber-400">${total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  Payment Details
                </CardTitle>
                <p className="text-slate-500 text-sm">This is a simulated payment — no real charges will be made.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Cardholder Name</label>
                  <Input
                    value={cardDetails.name}
                    onChange={e => setCardDetails(p => ({ ...p, name: e.target.value }))}
                    placeholder="John Smith"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Card Number</label>
                  <Input
                    value={cardDetails.number}
                    onChange={e => setCardDetails(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                    placeholder="1234 5678 9012 3456"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 font-mono"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 text-sm mb-2 block">Expiry Date</label>
                    <Input
                      value={cardDetails.expiry}
                      onChange={e => setCardDetails(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                      placeholder="MM/YY"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 font-mono"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm mb-2 block">CVV</label>
                    <Input
                      value={cardDetails.cvv}
                      onChange={e => setCardDetails(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="123"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 font-mono"
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-green-300 text-xs">Your payment is protected by 256-bit SSL encryption (simulated).</p>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 text-base font-semibold"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing Payment…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Pay ${total.toLocaleString()}
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}