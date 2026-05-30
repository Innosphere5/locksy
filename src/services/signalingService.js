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
    });

    socketService.on('call:ringing', (data) => {
      console.log('[SignalingService] Remote is ringing');
      if (useCallStore.getState().callStatus === 'calling') {
        useCallStore.getState().setCallStatus('ringing');
      }
    });

    socketService.on('call:answer', async (data) => {
      const { callId, answerSDP } = data;
      console.log('[SignalingService] Received Answer');
      await rtcService.setRemoteAnswer(answerSDP);
      useCallStore.getState().setCallStatus('connecting');
    });

    socketService.on('call:ice-candidate', async (data) => {
      const { candidate } = data;
      await rtcService.addIceCandidate(candidate);
    });

    socketService.on('call:rejected', (data) => {
      console.log('[SignalingService] Call Rejected');
      InCallManager.stopRingtone();
      this.cleanup();
      const state = useCallStore.getState();
      state.setCallStatus('ended');
      state.setEndReason('rejected');
      setTimeout(() => state.resetCall(), 2000);
    });

    socketService.on('call:ended', (data) => {
      console.log('[SignalingService] Call Ended by Remote');
      InCallManager.stopRingtone();
      this.cleanup();
      useCallStore.getState().setCallStatus('ended');
      setTimeout(() => useCallStore.getState().resetCall(), 2000);
    });

    socketService.on('call:busy', (data) => {
      console.log('[SignalingService] Target is busy');
      this.cleanup();
      useCallStore.getState().setCallStatus('ended');
      useCallStore.getState().setEndReason('busy');
      setTimeout(() => useCallStore.getState().resetCall(), 3000);
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
      
      // 4. Setup Auto-Timeout (45 seconds)
      if (this.callTimeout) clearTimeout(this.callTimeout);
      this.callTimeout = setTimeout(() => {
        console.log('[SignalingService] No answer timeout reached');
        this.endCall('no_answer');
      }, 45000);

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
      if (callStatus === 'ringing' || callStatus === 'calling') {
        socketService.emitCallReject(callId, remoteUser.id, 'cancelled');
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
