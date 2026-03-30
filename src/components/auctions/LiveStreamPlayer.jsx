import React, { useState } from 'react';
import { Radio, ExternalLink } from 'lucide-react';

function getEmbedUrl(url) {
  if (!url) return null;

  // YouTube: watch?v=ID or youtu.be/ID or live URLs
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1`;
  }

  // Twitch channel: twitch.tv/channelname
  const twitchChannel = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)(?:\?|$)/);
  if (twitchChannel) {
    return `https://player.twitch.tv/?channel=${twitchChannel[1]}&parent=${window.location.hostname}&autoplay=true&muted=true`;
  }

  // Twitch video: twitch.tv/videos/ID
  const twitchVideo = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (twitchVideo) {
    return `https://player.twitch.tv/?video=${twitchVideo[1]}&parent=${window.location.hostname}&autoplay=true&muted=true`;
  }

  return null;
}

export default function LiveStreamPlayer({ streamUrl }) {
  const [muted, setMuted] = useState(true);
  const embedUrl = getEmbedUrl(streamUrl);

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 border border-slate-700">
        <Radio className="w-8 h-8 text-slate-500" />
        <p className="text-slate-500 text-sm">Stream unavailable</p>
        <a href={streamUrl} target="_blank" rel="noopener noreferrer"
          className="text-amber-400 text-xs flex items-center gap-1 hover:underline">
          <ExternalLink className="w-3 h-3" /> Open stream
        </a>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-red-500/40 shadow-lg shadow-red-500/10">
      {/* LIVE badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Live Stream"
        />
      </div>
    </div>
  );
}