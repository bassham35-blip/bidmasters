import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AuctionChat({ auctionId, sellerEmail, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Load initial messages
  useEffect(() => {
    if (!auctionId) return;
    base44.entities.Message.filter({ auction_id: auctionId }, 'created_date', 200)
      .then(setMessages)
      .catch(() => {});
  }, [auctionId]);

  // Real-time subscription
  useEffect(() => {
    if (!auctionId) return;
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data?.auction_id !== auctionId) return;
      if (event.type === 'create') {
        setMessages(prev => [...prev, event.data]);
      }
    });
    return unsubscribe;
  }, [auctionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !user) return;
    setSending(true);
    setNewMessage('');
    await base44.entities.Message.create({
      auction_id: auctionId,
      sender_email: user.email,
      sender_name: user.full_name || 'Anonymous',
      content,
      is_seller: user.email === sellerEmail,
    });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-amber-400" />
        <h2 className="text-xl font-semibold text-white">Ask the Seller</h2>
        <span className="ml-auto text-xs text-slate-500">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Message list */}
      <div className="h-72 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <MessageCircle className="w-10 h-10 mb-2" />
            <p className="text-sm">No questions yet. Be the first to ask!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_email === user?.email;
          return (
            <div
              key={msg.id}
              className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {msg.is_seller && (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-xs text-slate-400">
                  {msg.is_seller ? 'Seller' : msg.sender_name}
                </span>
                <span className="text-xs text-slate-600">
                  · {format(new Date(msg.created_date), 'h:mm a')}
                </span>
              </div>
              <div
                className={cn(
                  'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  isOwn
                    ? 'bg-amber-500/20 text-amber-100 rounded-tr-sm'
                    : msg.is_seller
                    ? 'bg-slate-700 text-white border border-amber-500/30 rounded-tl-sm'
                    : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                )}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {user ? (
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this item..."
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="text-center py-3 border border-slate-700 rounded-lg">
          <p className="text-slate-400 text-sm">
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="text-amber-400 hover:underline"
            >
              Sign in
            </button>{' '}
            to ask the seller a question.
          </p>
        </div>
      )}
    </Card>
  );
}