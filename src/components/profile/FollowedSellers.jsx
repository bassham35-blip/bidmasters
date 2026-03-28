import React from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function FollowedSellers({ userEmail }) {
  const queryClient = useQueryClient();

  const { data: follows = [] } = useQuery({
    queryKey: ['follows', userEmail],
    queryFn: () => base44.entities.SellerFollow.filter({ follower_email: userEmail }),
    enabled: !!userEmail,
  });

  const { data: allAuctions = [] } = useQuery({
    queryKey: ['allAuctions'],
    queryFn: () => base44.entities.Auction.list('-created_date', 1000),
  });

  const unfollowMutation = useMutation({
    mutationFn: (followId) => base44.entities.SellerFollow.delete(followId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follows', userEmail] }),
  });

  if (follows.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium mb-1">Not following any sellers yet</p>
        <p className="text-sm">Browse auctions and follow sellers you like</p>
        <Link to="/Auctions">
          <Button className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            Browse Auctions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {follows.map(follow => {
        const sellerAuctions = allAuctions.filter(
          a => a.created_by === follow.seller_email && a.status === 'active' && new Date(a.end_time) > new Date()
        );
        return (
          <div key={follow.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">{follow.seller_name || follow.seller_email}</p>
                <p className="text-slate-400 text-sm">{sellerAuctions.length} active auction{sellerAuctions.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {sellerAuctions.length > 0 && (
                <Link to={`/Auctions?seller=${follow.seller_email}`}>
                  <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-amber-500/20 hover:text-amber-300">
                    View Auctions
                  </Button>
                </Link>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => unfollowMutation.mutate(follow.id)}
                className="bg-slate-700 border-slate-600 text-slate-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50"
              >
                <UserMinus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}