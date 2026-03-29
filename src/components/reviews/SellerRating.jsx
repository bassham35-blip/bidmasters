import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';

export default function SellerRating({ sellerEmail, size = 'sm' }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', sellerEmail],
    queryFn: () => base44.entities.Review.filter({ seller_email: sellerEmail }),
    enabled: !!sellerEmail,
  });

  if (reviews.length === 0) return (
    <span className={`text-slate-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>No ratings yet</span>
  );

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <Star
            key={s}
            className={`${starSize} ${s <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
          />
        ))}
      </div>
      <span className={`${textSize} text-slate-300 font-medium`}>{avg.toFixed(1)}</span>
      <span className={`${textSize} text-slate-500`}>({reviews.length})</span>
    </div>
  );
}