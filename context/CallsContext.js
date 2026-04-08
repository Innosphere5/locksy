import React, { createContext, useContext, useState, useCallback } from 'react';

const CallsContext = createContext();

// Sample call history data
const SAMPLE_CALLS = [
  {
    id: '1',
    name: 'Ghost_Fox',
    avatar: '🦊',
    type: 'voice', // 'voice' | 'video'
    direction: 'incoming', // 'incoming' | 'outgoing'
    duration: 4 * 60 + 32, // 4m 32s in seconds
    timestamp: new Date(Date.now() - 5 * 60000), // 5 mins ago
    encrypted: true,
    missed: false,
  },
  {
    id: '2',
    name: 'Shadow_Wolf',
    avatar: '🐺',
    type: 'video',
    direction: 'outgoing',
    duration: 7 * 60 + 15,
    timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    encrypted: true,
    missed: false,
  },
  {
    id: '3',
    name: 'Cipher_Eagle',
    avatar: '🦅',
    type: 'voice',
    direction: 'incoming',
    duration: 0,
    timestamp: new Date(Date.now() - 24 * 3600000), // 1 day ago
    encrypted: true,
    missed: true,
  },
  {
    id: '4',
    name: 'Iron_Mask',
    avatar: '🎭',
    type: 'video',
    direction: 'incoming',
    duration: 12 * 60 + 45,
    timestamp: new Date(Date.now() - 48 * 3600000), // 2 days ago
    encrypted: true,
    missed: false,
  },
];

export function CallsProvider({ children }) {
  const [callHistory, setCallHistory] = useState(SAMPLE_CALLS);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // Initiate a new call
  const initiateCall = useCallback(
    (contactId, contactName, contactAvatar, callType = 'voice') => {
      const newCall = {
        id: contactId,
        name: contactName,
        avatar: contactAvatar,
        type: callType,
        direction: 'outgoing',
        startTime: Date.now(),
        encrypted: true,
      };
      setActiveCall(newCall);
      return newCall;
    },
    []
  );

  // Receive incoming call
  const receiveIncomingCall = useCallback((caller) => {
    setIncomingCall(caller);
  }, []);

  // Accept incoming call
  const acceptCall = useCallback(() => {
    if (incomingCall) {
      const acceptedCall = {
        ...incomingCall,
        direction: 'incoming',
        startTime: Date.now(),
      };
      setActiveCall(acceptedCall);
      setIncomingCall(null);
    }
  }, [incomingCall]);

  // Decline incoming call
  const declineCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  // End active call
  const endCall = useCallback(() => {
    if (activeCall) {
      const duration = Math.floor((Date.now() - activeCall.startTime) / 1000);
      const callRecord = {
        ...activeCall,
        callId: `${activeCall.id}_${Date.now()}`, // Unique identifier for each call
        duration,
        timestamp: new Date(activeCall.startTime),
        missed: false,
      };
      setCallHistory((prev) => [callRecord, ...prev]);
    }
    setActiveCall(null);
    setCallDuration(0);
  }, [activeCall]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    setIsSpeaker((prev) => !prev);
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setCameraOn((prev) => !prev);
  }, []);

  // Update call duration
  const updateCallDuration = useCallback((duration) => {
    setCallDuration(duration);
  }, []);

  // Clear call history
  const clearCallHistory = useCallback(() => {
    setCallHistory([]);
  }, []);

  // Delete single call from history
  const deleteCallFromHistory = useCallback((callId) => {
    setCallHistory((prev) => prev.filter((call) => call.id !== callId));
  }, []);

  const value = {
    // State
    callHistory,
    activeCall,
    incomingCall,
    isMuted,
    isSpeaker,
    cameraOn,
    callDuration,

    // Methods
    initiateCall,
    receiveIncomingCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    updateCallDuration,
    clearCallHistory,
    deleteCallFromHistory,
  };

  return <CallsContext.Provider value={value}>{children}</CallsContext.Provider>;
}

export function useCalls() {
  const context = useContext(CallsContext);
  if (!context) {
    throw new Error('useCalls must be used within CallsProvider');
  }
  return context;
}
