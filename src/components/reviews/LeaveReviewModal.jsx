import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

export default function LeaveReviewModal({ open, onClose, auction, user, onReviewed }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if user already reviewed this auction
  const { data: existingReviews = [] } = useQuery({
    queryKey: ['my-review', auction?.id, user?.email],
    queryFn: () => base44.entities.Review.filter({ auction_id: auction.id, buyer_email: user.email }),
    enabled: !!auction?.id && !!user?.email,
  });

  const alreadyReviewed = existingReviews.length > 0;

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a star rating.'); return; }
    setSubmitting(true);
    await base44.entities.Review.create({
      auction_id: auction.id,
      seller_email: auction.created_by,
      buyer_email: user.email,
      buyer_name: user.full_name || 'Anonymous',
      rating,
      comment,
    });
    setSubmitting(false);
    toast.success('Review submitted!');
    onReviewed?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Rate Your Experience</DialogTitle>
        </DialogHeader>

        {alreadyReviewed ? (
          <div className="py-6 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-slate-300">You've already reviewed this auction.</p>
            <Button onClick={onClose} className="mt-4" variant="outline">Close</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-slate-400 text-sm mb-1">Seller: <span className="text-white">{auction?.seller_name}</span></p>
              <p className="text-slate-400 text-sm">Item: <span className="text-white">{auction?.title}</span></p>
            </div>

            <div>
              <p className="text-slate-300 text-sm mb-3">Your rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(s)}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        s <= (hovered || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-slate-300 text-sm mb-2">Comment (optional)</p>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this seller..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !rating}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}