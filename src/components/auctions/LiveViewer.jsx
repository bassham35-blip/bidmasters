import React, { useRef, useState, useEffect, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { Radio, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const signal = (action, auction_id, data = null) =>
  base44.functions.invoke('webrtcSignal', { action, auction_id, data }).then(r => r.data);

export default function LiveViewer({ auctionId }) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const pollRef = useRef(null);
  const [status, setStatus] = useState('waiting'); // waiting | connecting | live | offline
  const [retries, setRetries] = useState(0);

  const connect = useCallback(async () => {
    setStatus('connecting');

    const { offer } = await signal('get_offer', auctionId);
    if (!offer) {
      setStatus('waiting');
      return;
    }

    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (videoRef.current && e.streams[0]) {
        videoRef.current.srcObject = e.streams[0];
        setStatus('live');
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setStatus('offline');
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Add broadcaster ICE candidates
    const { candidates: bCandidates } = await signal('get_broadcaster_ice', auctionId);
    for (const c of (bCandidates || [])) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Wait for ICE gathering
    await new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') return resolve();
      pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') resolve(); };
      setTimeout(resolve, 3000);
    });

    await signal('set_answer', auctionId, pc.localDescription);

    // Send viewer ICE candidates
    const viewerCandidates = [];
    pc.onicecandidate = (e) => { if (e.candidate) viewerCandidates.push(e.candidate); };
    for (const c of viewerCandidates) {
      await signal('add_viewer_ice', auctionId, c).catch(() => {});
    }
  }, [auctionId]);

  useEffect(() => {
    // Poll for a live offer
    const tryConnect = async () => {
      await connect();
    };
    tryConnect();

    pollRef.current = setInterval(async () => {
      if (status !== 'live') {
        setRetries(r => r + 1);
        await connect();
      }
    }, 8000);

    return () => {
      clearInterval(pollRef.current);
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    };
  }, []);

  return (
    <div className="bg-black rounded-xl overflow-hidden border border-slate-700">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {status === 'live' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        {status === 'waiting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Radio className="w-10 h-10" />
            <p className="text-sm font-medium">Waiting for broadcaster…</p>
            <p className="text-xs text-slate-600">Stream will appear automatically</p>
          </div>
        )}

        {status === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Connecting to stream…</p>
          </div>
        )}

        {status === 'offline' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
            <WifiOff className="w-10 h-10" />
            <p className="text-sm font-medium">Stream ended or disconnected</p>
            <Button size="sm" variant="outline" onClick={() => { setStatus('waiting'); connect(); }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Reconnect
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}