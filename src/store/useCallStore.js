import { create } from 'zustand';

/**
 * Call States:
 * idle: No active call session
 * calling: Outgoing call initiated, waiting for receiver to ring
 * ringing: Incoming call received OR outgoing call is ringing at receiver
 * connecting: Call accepted, WebRTC negotiation in progress
 * connected: Media stream established
 * reconnecting: Peer connection lost, attempting to recover
 * ended: Call finished normally
 * failed: Call terminated due to error (ICE failure, busy, etc.)
 */

const useCallStore = create((set, get) => ({
  // --- CORE STATE ---
  callId: null,
  callStatus: 'idle',
  callType: 'voice', // 'voice' | 'video'
  isIncoming: false,
  remoteUser: null, // { id, name, avatar }
  
  // --- MEDIA STREAMS ---
  localStream: null,
  remoteStream: null,
  
  // --- UI CONTROLS ---
  isMuted: false,
  isVideoEnabled: true,
  isSpeaker: false,
  cameraMode: 'user', // 'user' | 'environment'
  
  // --- METADATA ---
  startTime: null,
  duration: 0,
  error: null,
  endReason: null, // 'busy' | 'no_answer' | 'rejected' | 'ended'

  // --- ACTIONS ---
  setCallId: (id) => set({ callId: id }),
  
  setCallStatus: (status) => {
    console.log(`[CallStore] Status: ${status}`);
    const updates = { callStatus: status };
    if (status === 'connected') {
      updates.startTime = Date.now();
    }
    if (status === 'idle' || status === 'ended') {
      updates.callId = null;
      updates.startTime = null;
      updates.duration = 0;
    }
    set(updates);
  },

  setRemoteUser: (user) => set({ remoteUser: user }),
  setCallType: (type) => set({ 
    callType: type,
    isVideoEnabled: type === 'video' 
  }),
  setIsIncoming: (incoming) => set({ isIncoming: incoming }),
  
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleVideo: () => set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),
  toggleSpeaker: () => set((state) => ({ isSpeaker: !state.isSpeaker })),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  
  setError: (error) => set({ error }),
  setEndReason: (reason) => set({ endReason: reason }),
  setDuration: (duration) => set({ duration }),

  resetCall: () => {
    const { localStream, remoteStream } = get();
    
    // Stop all tracks to release hardware
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }

    set({
      callId: null,
      callStatus: 'idle',
      callType: 'voice',
      isIncoming: false,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoEnabled: true,
      isSpeaker: false,
      cameraMode: 'user',
      startTime: null,
      duration: 0,
      error: null,
      endReason: null,
    });
  },
}));

export default useCallStore;
