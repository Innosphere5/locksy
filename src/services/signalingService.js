import useCallStore from '../store/useCallStore';
import rtcService from './rtcService';
import socketService from '../../utils/socketService';
import { v4 as uuidv4 } from 'uuid';
import InCallManager from 'react-native-incall-manager';

class SignalingService {
  initialized = false;
  isInitiating = false;
  callTimeout = null;

  /**
   * Initialize socket listeners for call events
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    console.log('[SignalingService] Initializing Listeners');

    socketService.on('call:offer', (data) => {
      const { callId, callerName, callType, callerId, offerSDP } = data;
      const callStore = useCallStore.getState();
      
      console.log(`[SignalingService] Incoming offer from ${callerName} (${callId})`);

      // De-duplication: If we are already ringing for THIS call, just update the offer and return
      if (callStore.callId === callId && callStore.callStatus === 'ringing') {
        console.log('[SignalingService] Duplicate offer received, updating SDP');
        this.pendingOffer = offerSDP;
        return;
      }

      // Real Busy Check: Only send busy if we are in a different active call
      if (callStore.callStatus !== 'idle' && callStore.callId !== callId) {
        console.log('[SignalingService] User busy on another call, emitting busy signal');
        socketService.emitCallBusy(callId, callerId);
        return;
      }

      callStore.setCallId(callId);
      callStore.setCallType(callType);
      callStore.setIsIncoming(true);
      callStore.setRemoteUser({
        id: callerId,
        name: callerName,
        avatar: '👤'
      });
      callStore.setCallStatus('ringing');
      
      // Start ringtone for incoming call
      InCallManager.startRingtone('_BUNDLE_');
      
      // Notify caller that we are ringing
      socketService.emitCallRinging(callId, callerId);
      
      // Cache the offer SDP for when we accept
      this.pendingOffer = offerSDP;

      // Setup incoming call safety timeout (28 seconds) to auto-reject if unanswered
      if (this.callTimeout) clearTimeout(this.callTimeout);
      this.callTimeout = setTimeout(() => {
        console.log('[SignalingService] Incoming call unanswered, auto-rejecting');
        this.rejectCall();
      }, 28000);
    });

    socketService.on('call:ringing', (data) => {
      console.log('[SignalingService] Remote is ringing');
      if (useCallStore.getState().callStatus === 'calling') {
        useCallStore.getState().setCallStatus('ringing_remote');
      }
    });

    socketService.on('call:answer', async (data) => {
      const { callId, answerSDP } = data;
      console.log('[SignalingService] Received Answer');
      // Clear caller's call timeout because the call has been answered!
      if (this.callTimeout) {
        clearTimeout(this.callTimeout);
        this.callTimeout = null;
      }
      await rtcService.setRemoteAnswer(answerSDP);
      useCallStore.getState().setCallStatus('connecting');
    });

    socketService.on('call:ice-candidate', async (data) => {
      const { candidate } = data;
      await rtcService.addIceCandidate(candidate);
    });

    socketService.on('call:rejected', (data) => {
      InCallManager.stopRingtone();
      this.cleanup();
      const state = useCallStore.getState();
      state.setEndReason(data.reason || 'rejected');
      state.setCallStatus('ended');
      // UI screens (VoiceCallScreen/VideoCallScreen) handle the resetCall() via
      // their isCallEnded effect — do NOT call it here to avoid double-reset
    });

    socketService.on('call:ended', (data) => {
      InCallManager.stopRingtone();
      this.cleanup();
      useCallStore.getState().setCallStatus('ended');
      // UI screens handle resetCall() via isCallEnded effect
    });

    socketService.on('call:busy', (data) => {
      this.cleanup();
      const state = useCallStore.getState();
      state.setEndReason('busy');
      state.setCallStatus('ended');
      // UI screens handle resetCall() via isCallEnded effect
    });
  }

  /**
   * Start an outgoing call
   */
  async startCall(receiverInfo, callerInfo, callType = 'voice') {
    if (this.isInitiating || useCallStore.getState().callStatus !== 'idle') return;

    this.isInitiating = true;
    const callId = uuidv4();
    const { id: receiverId, name: receiverName } = receiverInfo;
    const { id: callerId, name: callerName } = callerInfo;

    const callStore = useCallStore.getState();
    callStore.setCallId(callId);
    callStore.setCallType(callType);
    callStore.setIsIncoming(false);
    callStore.setRemoteUser({ id: receiverId, name: receiverName, avatar: '👤' });
    callStore.setCallStatus('calling');

    try {
      // 1. Setup Media
      await rtcService.setupLocalStream(callType);

      // 2. Setup PeerConnection
      rtcService.createPeerConnection((candidate) => {
        socketService.emitIceCandidate(callId, receiverId, candidate);
      });

      // 3. Create & Send Offer
      const offer = await rtcService.createOffer();
      socketService.emitCallOffer(receiverId, callerName, callType, callId, offer.sdp);

      InCallManager.start({ media: callType, ringback: true });
      
      // 4. Setup Auto-Timeout (25 seconds)
      if (this.callTimeout) clearTimeout(this.callTimeout);
      this.callTimeout = setTimeout(() => {
        console.log('[SignalingService] No answer timeout reached');
        this.endCall('no_answer');
      }, 25000);

      return callId;
    } catch (error) {
      console.error('[SignalingService] Start Call Error:', error);
      const errorMsg = error.message?.includes('Permission') ? 'Camera/Mic permission denied' : 'Call initiation failed';
      useCallStore.getState().setError(errorMsg);
      this.endCall();
      return null;
    } finally {
      this.isInitiating = false;
    }
  }

  /**
   * Accept an incoming call
   */
  async acceptCall() {
    const callStore = useCallStore.getState();
    const { callId, remoteUser, callType } = callStore;
    
    if (!callId || !this.pendingOffer) {
      console.warn('[SignalingService] No pending offer to accept');
      return;
    }

    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }

    console.log(`[SignalingService] Accepting call: ${callId}`);
    InCallManager.stopRingtone();
    callStore.setCallStatus('connecting');

    try {
      // 1. Setup Media
      await rtcService.setupLocalStream(callType);

      // 2. Setup PeerConnection
      rtcService.createPeerConnection((candidate) => {
        socketService.emitIceCandidate(callId, remoteUser.id, candidate);
      });

      // 3. Create & Send Answer
      const answer = await rtcService.createAnswer(this.pendingOffer);
      socketService.emitCallAnswer(callId, remoteUser.id, answer.sdp);

      this.pendingOffer = null;
      InCallManager.stopRingtone();
      InCallManager.start({ media: callType });
      
    } catch (error) {
      console.error('[SignalingService] Accept Call Error:', error);
      this.endCall();
    }
  }

  /**
   * Reject an incoming call
   */
  rejectCall() {
    const { callId, remoteUser } = useCallStore.getState();
    console.log(`[SignalingService] Rejecting call: ${callId}`);
    
    if (callId && remoteUser) {
      socketService.emitCallReject(callId, remoteUser.id, 'rejected');
    }
    
    this.cleanup();
    useCallStore.getState().setCallStatus('ended');
    setTimeout(() => useCallStore.getState().resetCall(), 1500);
  }

  /**
   * End the current call session
   */
  endCall(reason = 'ended') {
    const { callId, remoteUser, callStatus } = useCallStore.getState();
    
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }

    if (callId && remoteUser) {
      if (callStatus === 'ringing' || callStatus === 'calling' || callStatus === 'ringing_remote') {
        socketService.emitCallReject(callId, remoteUser.id, reason === 'no_answer' ? 'no_answer' : 'cancelled');
      } else {
        socketService.emitCallEnd(callId, remoteUser.id, reason);
      }
    }
    
    this.cleanup();
    const state = useCallStore.getState();
    state.setCallStatus('ended');
    state.setEndReason(reason);
    setTimeout(() => state.resetCall(), 1500);
  }

  cleanup() {
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }
    rtcService.close();
    InCallManager.stop();
    InCallManager.stopRingtone();
    this.pendingOffer = null;
  }
}

const signalingService = new SignalingService();
export default signalingService;
