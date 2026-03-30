import React, { useRef, useState, useEffect, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Radio, Video, VideoOff, Mic, MicOff, X } from "lucide-react";

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const signal = (action, auction_id, data = null) =>
  base44.functions.invoke('webrtcSignal', { action, auction_id, data }).then(r => r.data);

export default function LiveBroadcaster({ auctionId, onStop }) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const pollRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | starting | live | error
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState(null);

  const stopBroadcast = useCallback(async () => {
    clearInterval(pollRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    await signal('clear', auctionId).catch(() => {});
    setStatus('idle');
    onStop?.();
  }, [auctionId, onStop]);

  const startBroadcast = useCallback(async () => {
    setStatus('starting');
    setError(null);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const candidates = [];
    pc.onicecandidate = (e) => {
      if (e.candidate) candidates.push(e.candidate);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for ICE gathering
    await new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') return resolve();
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') resolve();
      };
      setTimeout(resolve, 3000);
    });

    await signal('set_offer', auctionId, pc.localDescription);
    for (const c of candidates) {
      await signal('add_broadcaster_ice', auctionId, c);
    }

    setStatus('live');

    // Poll for answer from viewer
    pollRef.current = setInterval(async () => {
      if (!pcRef.current || pcRef.current.remoteDescription) return;
      const { answer } = await signal('get_answer', auctionId);
      if (answer && pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        const { candidates: vCandidates } = await signal('get_viewer_ice', auctionId);
        for (const c of (vCandidates || [])) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
      }
    }, 2000);
  }, [auctionId]);

  useEffect(() => () => { stopBroadcast(); }, []);

  const toggleVideo = () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setVideoEnabled(track.enabled); }
  };

  const toggleAudio = () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setAudioEnabled(track.enabled); }
  };

  return (
    <div className="bg-slate-900 border border-red-500/30 rounded-xl overflow-hidden">
      {/* Preview */}
      <div className="relative aspect-video bg-black">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        {status === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
            <Video className="w-10 h-10 text-slate-600" />
            <p className="text-slate-500 text-sm">Camera preview will appear here</p>
          </div>
        )}
        {status === 'live' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}
        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 flex items-center gap-2">
        {status === 'idle' && (
          <Button onClick={startBroadcast} className="bg-red-600 hover:bg-red-700 text-white gap-2 flex-1">
            <Radio className="w-4 h-4" /> Go Live
          </Button>
        )}
        {status === 'live' && (
          <>
            <Button size="icon" variant="ghost" onClick={toggleVideo} className="text-slate-300 hover:text-white hover:bg-slate-800">
              {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-red-400" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={toggleAudio} className="text-slate-300 hover:text-white hover:bg-slate-800">
              {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-400" />}
            </Button>
            <Button onClick={stopBroadcast} variant="destructive" className="ml-auto gap-2">
              <X className="w-4 h-4" /> End Stream
            </Button>
          </>
        )}
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    </div>
  );
}