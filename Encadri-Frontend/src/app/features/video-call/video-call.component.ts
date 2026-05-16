import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { VideoCallService } from '../../core/services/video-call.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

// Azure Communication Services SDK
import { CallClient, CallAgent, DeviceManager, Call, RemoteParticipant, VideoStreamRenderer, LocalVideoStream } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiCardComponent],
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit, AfterViewInit, OnDestroy {
  private videoCallService = inject(VideoCallService);
  private route = inject(ActivatedRoute);

  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('previewVideo') previewVideoRef!: ElementRef<HTMLVideoElement>;

  // Meeting info from route params
  meetingId?: string;
  meetingTitle?: string;

  // State
  isCallActive = signal(false);
  isConnecting = signal(false);
  error = signal<string>('');
  participantCount = signal(1); // Start with 1 (yourself)
  isMuted = signal(false);
  isVideoOn = signal(true);

  // Azure Communication Services objects
  private callClient?: CallClient;
  private callAgent?: CallAgent;
  private deviceManager?: DeviceManager;
  private call?: Call;
  private localVideoStream?: LocalVideoStream;
  private remoteParticipantStreams: Map<string, any> = new Map();

  async ngOnInit() {
    // Get meeting ID from route
    this.route.paramMap.subscribe(params => {
      this.meetingId = params.get('meetingId') || undefined;
    });

    // Get meeting title from query params if provided
    this.route.queryParamMap.subscribe(params => {
      this.meetingTitle = params.get('title') || 'Video Meeting';
    });

    // Initialize device manager
    await this.initializeDeviceManager();
  }

  async ngAfterViewInit() {
    // Show camera preview in waiting room
    await this.showPreview();
  }

  async ngOnDestroy() {
    await this.cleanup();
  }

  /**
   * Initialize device manager and request camera/microphone permissions
   */
  private async initializeDeviceManager() {
    try {
      this.callClient = new CallClient();

      // Get a token to initialize the device manager
      const tokenResponse = await firstValueFrom(this.videoCallService.getCallToken());
      if (!tokenResponse) {
        throw new Error('Failed to get call token');
      }

      const tokenCredential = new AzureCommunicationTokenCredential(tokenResponse.token);
      this.callAgent = await this.callClient.createCallAgent(tokenCredential, {
        displayName: 'User' // Will be replaced with actual user name if needed
      });

      this.deviceManager = await this.callClient.getDeviceManager();

      // Request permissions
      await this.deviceManager.askDevicePermission({ audio: true, video: true });

    } catch (err: any) {
      console.error('Failed to initialize device manager:', err);

      // Provide specific error messages based on error type
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.error.set('Camera and microphone access denied. Please grant permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        this.error.set('No camera or microphone found. Please connect a device and try again.');
      } else if (err.message?.includes('not configured') || err.message?.includes('token')) {
        this.error.set('Video call service is not configured. Please contact your administrator.');
      } else {
        this.error.set('Failed to access camera and microphone. Please grant permissions and try again.');
      }
    }
  }

  /**
   * Show camera preview in waiting room
   */
  private async showPreview() {
    if (!this.deviceManager) return;

    try {
      const cameras = await this.deviceManager.getCameras();
      if (cameras.length > 0) {
        this.localVideoStream = new LocalVideoStream(cameras[0]);

        if (this.previewVideoRef && this.previewVideoRef.nativeElement) {
          const renderer = new VideoStreamRenderer(this.localVideoStream);
          const view = await renderer.createView();
          // Cast to MediaStream for video element compatibility
          const videoElement = this.previewVideoRef.nativeElement;
          videoElement.srcObject = view.target as unknown as MediaStream;
        }
      }
    } catch (err: any) {
      console.error('Failed to show preview:', err);
    }
  }

  /**
   * Start the video call and join the group call
   */
  async startCall() {
    if (!this.meetingId) {
      this.error.set('No meeting ID provided');
      return;
    }

    if (!this.callAgent || !this.deviceManager) {
      this.error.set('Device manager not initialized');
      return;
    }

    this.isConnecting.set(true);
    this.error.set('');

    try {
      // Get cameras
      const cameras = await this.deviceManager.getCameras();
      if (cameras.length === 0) {
        throw new Error('No camera found');
      }

      // Create local video stream if not already created
      if (!this.localVideoStream) {
        this.localVideoStream = new LocalVideoStream(cameras[0]);
      }

      // Join the group call using the meetingId as the group ID
      // Azure ACS uses UUID format for group IDs
      this.call = this.callAgent.join(
        { groupId: this.meetingId },
        {
          videoOptions: {
            localVideoStreams: [this.localVideoStream]
          },
          audioOptions: {
            muted: false
          }
        }
      );

      // Subscribe to call events
      this.subscribeToCall(this.call);

      // Render local video
      await this.renderLocalVideo();

      this.isCallActive.set(true);
      this.isConnecting.set(false);

    } catch (err: any) {
      console.error('Failed to start call:', err);
      this.error.set(err.message || 'Failed to join the meeting');
      this.isConnecting.set(false);
    }
  }

  /**
   * Subscribe to call state changes and participant events
   */
  private subscribeToCall(call: Call) {
    // Listen for state changes
    call.on('stateChanged', () => {
      console.log('Call state:', call.state);
      if (call.state === 'Disconnected') {
        this.isCallActive.set(false);
      }
    });

    // Listen for remote participants
    call.on('remoteParticipantsUpdated', (e: any) => {
      // Participants added
      e.added.forEach((participant: RemoteParticipant) => {
        this.subscribeToRemoteParticipant(participant);
        this.updateParticipantCount();
      });

      // Participants removed
      e.removed.forEach((participant: RemoteParticipant) => {
        this.removeRemoteParticipantVideo(participant.identifier);
        this.updateParticipantCount();
      });
    });

    // Handle existing participants (already in the call when we join)
    call.remoteParticipants.forEach((participant: RemoteParticipant) => {
      this.subscribeToRemoteParticipant(participant);
    });

    this.updateParticipantCount();
  }

  /**
   * Subscribe to remote participant video streams
   */
  private subscribeToRemoteParticipant(participant: RemoteParticipant) {
    participant.on('videoStreamsUpdated', async (e: any) => {
      // Video streams added
      e.added.forEach(async (stream: any) => {
        await this.renderRemoteVideo(stream, participant.identifier);
      });

      // Video streams removed
      e.removed.forEach((stream: any) => {
        this.removeRemoteParticipantVideo(participant.identifier);
      });
    });

    // Render existing video streams
    participant.videoStreams.forEach(async (stream: any) => {
      await this.renderRemoteVideo(stream, participant.identifier);
    });
  }

  /**
   * Render local video stream
   */
  private async renderLocalVideo() {
    if (!this.localVideoStream || !this.localVideoRef || !this.localVideoRef.nativeElement) {
      console.warn('Cannot render local video: missing stream or video element');
      return;
    }

    try {
      const renderer = new VideoStreamRenderer(this.localVideoStream);
      const view = await renderer.createView();
      // Cast to MediaStream for video element compatibility
      const videoElement = this.localVideoRef.nativeElement;
      videoElement.srcObject = view.target as unknown as MediaStream;
    } catch (err: any) {
      console.error('Failed to render local video:', err);
      this.error.set('Failed to display your camera. Please try again.');
    }
  }

  /**
   * Render remote participant video stream
   */
  private async renderRemoteVideo(stream: any, participantId: any) {
    try {
      const renderer = new VideoStreamRenderer(stream);
      const view = await renderer.createView();

      // Create video element for remote participant
      const videoContainer = document.querySelector('.video-grid');
      if (!videoContainer) return;

      // Remove placeholder if exists
      const placeholder = videoContainer.querySelector('.video-placeholder');
      if (placeholder) {
        placeholder.remove();
      }

      // Create or update video tile for this participant
      let videoTile = document.getElementById(`remote-${participantId.communicationUserId}`);

      if (!videoTile) {
        videoTile = document.createElement('div');
        videoTile.id = `remote-${participantId.communicationUserId}`;
        videoTile.className = 'video-tile remote-video';

        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        // Cast to MediaStream for video element compatibility
        videoElement.srcObject = view.target as unknown as MediaStream;

        const label = document.createElement('div');
        label.className = 'video-label';
        label.textContent = 'Participant';

        videoTile.appendChild(videoElement);
        videoTile.appendChild(label);
        videoContainer.appendChild(videoTile);
      } else {
        const videoElement = videoTile.querySelector('video');
        if (videoElement) {
          // Cast to MediaStream for video element compatibility
          videoElement.srcObject = view.target as unknown as MediaStream;
        }
      }

      // Store renderer for cleanup
      this.remoteParticipantStreams.set(participantId.communicationUserId, renderer);

    } catch (err: any) {
      console.error('Failed to render remote video:', err);
    }
  }

  /**
   * Remove remote participant video
   */
  private removeRemoteParticipantVideo(participantId: any) {
    const videoTile = document.getElementById(`remote-${participantId.communicationUserId}`);
    if (videoTile) {
      videoTile.remove();
    }

    // Dispose renderer
    const renderer = this.remoteParticipantStreams.get(participantId.communicationUserId);
    if (renderer) {
      renderer.dispose();
      this.remoteParticipantStreams.delete(participantId.communicationUserId);
    }
  }

  /**
   * Update participant count
   */
  private updateParticipantCount() {
    if (this.call) {
      // +1 for local user
      this.participantCount.set(this.call.remoteParticipants.length + 1);
    }
  }

  /**
   * Toggle microphone mute
   */
  async toggleMute() {
    if (!this.call) return;

    try {
      if (this.isMuted()) {
        await this.call.unmute();
        this.isMuted.set(false);
      } else {
        await this.call.mute();
        this.isMuted.set(true);
      }
    } catch (err: any) {
      console.error('Failed to toggle mute:', err);
    }
  }

  /**
   * Toggle video on/off
   */
  async toggleVideo() {
    if (!this.call || !this.localVideoStream) return;

    try {
      if (this.isVideoOn()) {
        await this.call.stopVideo(this.localVideoStream);
        this.isVideoOn.set(false);
      } else {
        await this.call.startVideo(this.localVideoStream);
        this.isVideoOn.set(true);
      }
    } catch (err: any) {
      console.error('Failed to toggle video:', err);
    }
  }

  /**
   * Share screen
   */
  async shareScreen() {
    if (!this.call) return;

    try {
      // Screen sharing implementation
      console.log('Screen sharing requested - feature to be implemented');
      this.error.set('Screen sharing coming soon!');
      setTimeout(() => this.error.set(''), 3000);
    } catch (err: any) {
      console.error('Failed to share screen:', err);
    }
  }

  /**
   * End the call
   */
  async endCall() {
    if (this.call) {
      try {
        await this.call.hangUp();
        this.call = undefined;
        this.isCallActive.set(false);
      } catch (err: any) {
        console.error('Failed to end call:', err);
      }
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup() {
    // Dispose all remote participant renderers
    this.remoteParticipantStreams.forEach(renderer => {
      renderer.dispose();
    });
    this.remoteParticipantStreams.clear();

    // Dispose local video stream
    if (this.localVideoStream) {
      // LocalVideoStream doesn't have a stop method, we just set it to undefined
      this.localVideoStream = undefined;
    }

    // Hang up call
    await this.endCall();

    // Dispose call agent
    if (this.callAgent) {
      await this.callAgent.dispose();
    }
  }
}
