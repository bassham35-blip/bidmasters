import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { DollarSign, Building2, CreditCard } from 'lucide-react';

export default function RequestPayoutModal({ open, onClose, availableBalance, seller, eligibleAuctionIds, onSuccess }) {
  const [method, setMethod] = useState('stripe');
  const [amount, setAmount] = useState(availableBalance?.toFixed(2) || '');
  const [stripeEmail, setStripeEmail] = useState(seller?.email || '');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankRouting, setBankRouting] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > availableBalance) { toast.error('Amount exceeds available balance'); return; }
    if (method === 'stripe' && !stripeEmail) { toast.error('Enter your Stripe email'); return; }
    if (method === 'bank_transfer' && (!bankName || !bankAccount || !bankRouting)) {
      toast.error('Fill in all bank details'); return;
    }

    setLoading(true);
    await base44.entities.PayoutRequest.create({
      seller_email: seller.email,
      seller_name: seller.full_name,
      amount: amt,
      method,
      status: 'pending',
      stripe_email: method === 'stripe' ? stripeEmail : undefined,
      bank_account_name: method === 'bank_transfer' ? bankName : undefined,
      bank_account_number: method === 'bank_transfer' ? bankAccount : undefined,
      bank_routing_number: method === 'bank_transfer' ? bankRouting : undefined,
      auction_ids: eligibleAuctionIds || [],
    });
    setLoading(false);
    toast.success('Payout request submitted!');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" /> Request Payout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="text-slate-300 mb-1 block">Available Balance</Label>
            <div className="text-2xl font-bold text-amber-400">${availableBalance?.toFixed(2)}</div>
          </div>

          <div>
            <Label className="text-slate-300 mb-2 block">Amount to Request</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              max={availableBalance}
              className="bg-slate-800 border-slate-700 text-white focus:border-amber-500"
            />
          </div>

          <div>
            <Label className="text-slate-300 mb-2 block">Payout Method</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMethod('stripe')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${method === 'stripe' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500'}`}
              >
                <CreditCard className="w-4 h-4" /> Stripe
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${method === 'bank_transfer' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500'}`}
              >
                <Building2 className="w-4 h-4" /> Bank Transfer
              </button>
            </div>
          </div>

          {method === 'stripe' && (
            <div>
              <Label className="text-slate-300 mb-2 block">Stripe Account Email</Label>
              <Input
                value={stripeEmail}
                onChange={e => setStripeEmail(e.target.value)}
                placeholder="your@stripe.com"
                className="bg-slate-800 border-slate-700 text-white focus:border-amber-500"
              />
            </div>
          )}

          {method === 'bank_transfer' && (
            <div className="space-y-3">
              <div>
                <Label className="text-slate-300 mb-1 block">Account Holder Name</Label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="John Smith" className="bg-slate-800 border-slate-700 text-white focus:border-amber-500" />
              </div>
              <div>
                <Label className="text-slate-300 mb-1 block">Account Number</Label>
                <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="000123456789" className="bg-slate-800 border-slate-700 text-white focus:border-amber-500" />
              </div>
              <div>
                <Label className="text-slate-300 mb-1 block">Routing Number</Label>
                <Input value={bankRouting} onChange={e => setBankRouting(e.target.value)} placeholder="021000021" className="bg-slate-800 border-slate-700 text-white focus:border-amber-500" />
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {loading ? 'Submitting…' : 'Submit Payout Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}