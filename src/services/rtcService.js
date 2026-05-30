import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import useCallStore from '../store/useCallStore';
import InCallManager from 'react-native-incall-manager';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

class RTCService {
  pc = null;
  localStream = null;
  candidateQueue = [];

  /**
   * Request and setup local media stream
   */
  async setupLocalStream(callType = 'voice') {
    const isVideo = callType === 'video';
    
    // Cleanup existing stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    try {
      console.log(`[RTCService] Getting UserMedia: ${callType}`);
      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideo ? {
          facingMode: 'user',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
        } : false,
      });

      this.localStream = stream;
      useCallStore.getState().setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('[RTCService] getUserMedia Error:', error);
      throw error;
    }
  }

  /**
   * Initialize PeerConnection
   */
  createPeerConnection(onIceCandidate) {
    if (this.pc) {
      this.close();
    }

    console.log('[RTCService] Initializing PeerConnection');
    this.pc = new RTCPeerConnection(configuration);

    // 1. ICE Candidate Handler
    this.pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    // 2. Track Handler
    this.pc.ontrack = (event) => {
      console.log(`[RTCService] Remote track received: ${event.track.kind}`);
      
      let remoteStream = useCallStore.getState().remoteStream;
      
      // If we don't have a remote stream yet, create one
      if (!remoteStream) {
        remoteStream = new MediaStream();
        useCallStore.getState().setRemoteStream(remoteStream);
      }

      // Add the track to the existing stream
      remoteStream.addTrack(event.track);
      
      // CRITICAL: We must set a NEW reference to trigger a re-render in React
      // Using new MediaStream(remoteStream) ensures the UI sees a 'change'
      const updatedStream = new MediaStream(remoteStream.getTracks());
      useCallStore.getState().setRemoteStream(updatedStream);
    };

    // 3. Connection State Handler
    this.pc.oniceconnectionstatechange = () => {
      if (!this.pc) return;
      const state = this.pc.iceConnectionState;
      console.log(`[RTCService] ICE State: ${state}`);
      
      if (state === 'connected') {
        useCallStore.getState().setCallStatus('connected');
      } else if (state === 'failed' || state === 'disconnected') {
        // We could trigger a reconnect here
        console.warn('[RTCService] Connection state issue:', state);
      }
    };

    // 4. Add Local Tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.localStream);
      });
    }

    return this.pc;
  }

  /**
   * Create SDP Offer
   */
  async createOffer() {
    try {
      const offer = await this.pc.createOffer();
      // Munge SDP to set a stable mobile bitrate (1000kbps)
      offer.sdp = offer.sdp.replace(/b=AS:([0-9]+)/g, 'b=AS:1000');
      if (!offer.sdp.includes('b=AS:')) {
        offer.sdp = offer.sdp.replace(/c=IN IP4 (.*)\r\n/g, 'c=IN IP4 $1\r\nb=AS:1000\r\n');
      }
      await this.pc.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('[RTCService] Create Offer Error:', error);
      throw error;
    }
  }

  /**
   * Create SDP Answer
   */
  async createAnswer(offerSDP) {
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: offerSDP
      }));
      const answer = await this.pc.createAnswer();
      // Munge SDP to set a stable mobile bitrate (1000kbps)
      answer.sdp = answer.sdp.replace(/b=AS:([0-9]+)/g, 'b=AS:1000');
      if (!answer.sdp.includes('b=AS:')) {
        answer.sdp = answer.sdp.replace(/c=IN IP4 (.*)\r\n/g, 'c=IN IP4 $1\r\nb=AS:1000\r\n');
      }
      await this.pc.setLocalDescription(answer);
      
      // Process any candidates received before remote description was set
      await this.processCandidateQueue();
      
      return answer;
    } catch (error) {
      console.error('[RTCService] Create Answer Error:', error);
      throw error;
    }
  }

  /**
   * Set Remote Answer
   */
  async setRemoteAnswer(sdp) {
    if (!this.pc) {
      console.warn('[RTCService] setRemoteAnswer called but PeerConnection is null');
      return;
    }

    // Guard: Only apply answer if we have sent an offer
    if (this.pc.signalingState !== 'have-local-offer') {
      console.log(`[RTCService] Skipping setRemoteAnswer: State is ${this.pc.signalingState}`);
      return;
    }

    try {
      console.log('[RTCService] Setting Remote Answer');
      const answer = new RTCSessionDescription({ type: 'answer', sdp });
      await this.pc.setRemoteDescription(answer);
      await this.processCandidateQueue();
    } catch (error) {
      console.error('[RTCService] Set Remote Answer Error:', error);
    }
  }

  /**
   * Add Remote ICE Candidate
   */
  async addIceCandidate(candidate) {
    if (!candidate) return;
    
    if (this.pc && this.pc.remoteDescription) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[RTCService] Error adding ICE candidate:', e);
      }
    } else {
      this.candidateQueue.push(candidate);
    }
  }

  async processCandidateQueue() {
    if (this.candidateQueue.length > 0) {
      console.log(`[RTCService] Flushing ${this.candidateQueue.length} queued candidates`);
      for (const candidate of this.candidateQueue) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[RTCService] Queued candidate error:', e);
        }
      }
      this.candidateQueue = [];
    }
  }

  /**
   * Media Control Methods
   */
  toggleMute(isMuted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }

  toggleVideo(isEnabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = isEnabled;
      });
    }
  }

  switchCamera() {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track._switchCamera();
      });
    }
  }

  setSpeaker(isEnabled) {
    InCallManager.setSpeakerphoneOn(isEnabled);
  }

  /**
   * Complete Cleanup
   */
  close() {
    console.log('[RTCService] Closing Session');
    
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.candidateQueue = [];
    InCallManager.stop();
  }
}

export default new RTCService();
