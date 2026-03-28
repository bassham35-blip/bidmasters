import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FollowSellerButton({ sellerEmail, sellerName, currentUserEmail }) {
  const [followRecord, setFollowRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserEmail || !sellerEmail || currentUserEmail === sellerEmail) {
      setLoading(false);
      return;
    }
    base44.entities.SellerFollow.filter({ follower_email: currentUserEmail, seller_email: sellerEmail })
      .then(results => {
        setFollowRecord(results[0] || null);
        setLoading(false);
      });
  }, [currentUserEmail, sellerEmail]);

  if (!currentUserEmail || !sellerEmail || currentUserEmail === sellerEmail || loading) return null;

  const handleToggle = async () => {
    if (followRecord) {
      await base44.entities.SellerFollow.delete(followRecord.id);
      setFollowRecord(null);
    } else {
      const created = await base44.entities.SellerFollow.create({
        follower_email: currentUserEmail,
        seller_email: sellerEmail,
        seller_name: sellerName,
      });
      setFollowRecord(created);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(); }}
      className={followRecord
        ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300"
        : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-300"
      }
    >
      {followRecord
        ? <><UserCheck className="w-3.5 h-3.5 mr-1" /> Following</>
        : <><UserPlus className="w-3.5 h-3.5 mr-1" /> Follow</>
      }
    </Button>
  );
}