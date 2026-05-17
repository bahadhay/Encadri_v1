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

  @ViewChild('localVideoContainer') localVideoContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('previewVideoContainer') previewVideoContainerRef!: ElementRef<HTMLDivElement>;

  // Meeting info from route params
  meetingId?: string;
  meetingTitle?: string;

  // State
  isCallActive = signal(false);
  isConnecting = signal(false);
  error = signal<string>('');
  participantCount = signal(1); // Start with 1 (yourself)
  isMuted = signal(true); // Start muted by default
  isVideoOn = signal(false); // Start with camera off by default
  previewVideoRendered = false;

  // Azure Communication Services objects
  private callClient?: CallClient;
  private callAgent?: CallAgent;
  private deviceManager?: DeviceManager;
  private call?: Call;
  private localVideoStream?: LocalVideoStream;
  private localVideoRenderer?: VideoStreamRenderer;
  private previewVideoRenderer?: VideoStreamRenderer;
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
   * Get user initials for avatar display
   */
  getUserInitials(): string {
    // You can customize this to get from user profile
    return 'FI'; // For now, using default initials
  }

  /**
   * Toggle camera in preview (before joining call)
   */
  async togglePreviewCamera() {
    if (this.isVideoOn()) {
      // Turn off camera in preview
      this.isVideoOn.set(false);
      if (this.previewVideoContainerRef && this.previewVideoContainerRef.nativeElement) {
        this.previewVideoContainerRef.nativeElement.innerHTML = '';
      }
      if (this.previewVideoRenderer) {
        this.previewVideoRenderer.dispose();
        this.previewVideoRenderer = undefined;
      }
      this.previewVideoRendered = false;
    } else {
      // Turn on camera in preview
      this.isVideoOn.set(true);
      await this.showPreview();
    }
  }

  /**
   * Toggle microphone in preview (before joining call)
   */
  togglePreviewMic() {
    this.isMuted.set(!this.isMuted());
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
    if (!this.deviceManager || this.previewVideoRendered) return;

    try {
      const cameras = await this.deviceManager.getCameras();
      console.log('Available cameras:', cameras.length);

      if (cameras.length > 0 && this.isVideoOn()) {
        this.localVideoStream = new LocalVideoStream(cameras[0]);
        console.log('Created local video stream for preview');

        if (this.previewVideoContainerRef && this.previewVideoContainerRef.nativeElement) {
          const renderer = new VideoStreamRenderer(this.localVideoStream);
          const view = await renderer.createView();

          console.log('Preview view.target:', view.target);
          console.log('Preview view.target type:', view.target.tagName);

          const container = this.previewVideoContainerRef.nativeElement;

          // Clear container first
          container.innerHTML = '';

          // Ensure the video element has proper styling
          const videoElement = view.target as HTMLVideoElement;
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';

          container.appendChild(videoElement);
          console.log('✅ Appended preview video to container');

          // Store renderer for cleanup
          this.previewVideoRenderer = renderer;
          this.previewVideoRendered = true;
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
      if (cameras.length === 0 && this.isVideoOn()) {
        throw new Error('No camera found');
      }

      // Create local video stream only if camera should be on
      const localVideoStreams = [];
      if (this.isVideoOn()) {
        if (!this.localVideoStream) {
          this.localVideoStream = new LocalVideoStream(cameras[0]);
        }
        localVideoStreams.push(this.localVideoStream);
      }

      // Join the group call using the meetingId as the group ID
      // Azure ACS uses UUID format for group IDs
      this.call = this.callAgent.join(
        { groupId: this.meetingId },
        {
          videoOptions: {
            localVideoStreams: localVideoStreams
          },
          audioOptions: {
            muted: this.isMuted() // Use current mute state
          }
        }
      );

      // Subscribe to call events
      this.subscribeToCall(this.call);

      // Render local video only if camera is on
      if (this.isVideoOn()) {
        await this.renderLocalVideo();
      }

      this.isCallActive.set(true);
      this.isConnecting.set(false);

      console.log('✅ Joined call with camera:', this.isVideoOn(), 'mic:', !this.isMuted());

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
    // Create participant tile immediately (with or without video)
    this.createRemoteParticipantTile(participant);

    participant.on('videoStreamsUpdated', async (e: any) => {
      // Video streams added (participant turned on camera)
      e.added.forEach(async (stream: any) => {
        // Subscribe to isAvailable changes
        stream.on('isAvailableChanged', async () => {
          if (stream.isAvailable) {
            await this.renderRemoteVideo(stream, participant.identifier);
          } else {
            this.showRemoteParticipantAvatar(participant.identifier);
          }
        });

        // Render immediately if already available
        if (stream.isAvailable) {
          await this.renderRemoteVideo(stream, participant.identifier);
        }
      });

      // Video streams removed (participant turned off camera)
      e.removed.forEach((stream: any) => {
        this.showRemoteParticipantAvatar(participant.identifier);
      });
    });

    // Render existing video streams or show avatar
    if (participant.videoStreams && participant.videoStreams.length > 0) {
      participant.videoStreams.forEach(async (stream: any) => {
        // Subscribe to isAvailable changes
        stream.on('isAvailableChanged', async () => {
          if (stream.isAvailable) {
            await this.renderRemoteVideo(stream, participant.identifier);
          } else {
            this.showRemoteParticipantAvatar(participant.identifier);
          }
        });

        // Render immediately if already available
        if (stream.isAvailable) {
          await this.renderRemoteVideo(stream, participant.identifier);
        } else {
          // Stream exists but not available yet, show avatar
          this.showRemoteParticipantAvatar(participant.identifier);
        }
      });
    } else {
      // No video stream, show avatar
      this.showRemoteParticipantAvatar(participant.identifier);
    }
  }

  /**
   * Render local video stream
   */
  private async renderLocalVideo() {
    if (!this.localVideoStream || !this.localVideoContainerRef || !this.localVideoContainerRef.nativeElement) {
      console.warn('Cannot render local video: missing stream or container');
      return;
    }

    try {
      const renderer = new VideoStreamRenderer(this.localVideoStream);
      const view = await renderer.createView();

      console.log('Local view.target:', view.target);
      console.log('Local view.target type:', view.target.tagName);

      const container = this.localVideoContainerRef.nativeElement;

      // Clear container first
      container.innerHTML = '';

      // Ensure the video element has proper styling
      const videoElement = view.target as HTMLVideoElement;
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';

      container.appendChild(videoElement);
      console.log('Appended local video to container');

      // Store renderer for cleanup
      this.localVideoRenderer = renderer;
    } catch (err: any) {
      console.error('Failed to render local video:', err);
      this.error.set('Failed to display your camera. Please try again.');
    }
  }

  /**
   * Create remote participant tile structure
   */
  private createRemoteParticipantTile(participant: RemoteParticipant) {
    const participantId = (participant.identifier as any).communicationUserId;
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;

    // Check if tile already exists
    if (document.getElementById(`remote-${participantId}`)) {
      return;
    }

    // Create video tile
    const videoTile = document.createElement('div');
    videoTile.id = `remote-${participantId}`;
    videoTile.className = 'video-tile remote-video';

    // Create video container
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `remote-video-container-${participantId}`;

    // Create avatar container (hidden by default)
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'video-avatar';
    avatarContainer.id = `remote-avatar-${participantId}`;
    avatarContainer.style.display = 'none';
    avatarContainer.innerHTML = `
      <div class="avatar-circle">
        <span class="avatar-initials">P</span>
      </div>
      <div class="camera-off-indicator">
        <span>📹</span>
        <span class="off-text">Camera is off</span>
      </div>
    `;

    // Create label
    const label = document.createElement('div');
    label.className = 'video-label';
    label.innerHTML = '<span>Participant</span>';

    videoTile.appendChild(videoContainer);
    videoTile.appendChild(avatarContainer);
    videoTile.appendChild(label);
    videoGrid.appendChild(videoTile);

    console.log('Created remote participant tile:', participantId);
  }

  /**
   * Show avatar for remote participant (when camera is off)
   */
  private showRemoteParticipantAvatar(participantId: any) {
    const userId = participantId.communicationUserId;
    const videoContainer = document.getElementById(`remote-video-container-${userId}`);
    const avatarContainer = document.getElementById(`remote-avatar-${userId}`);

    if (videoContainer && avatarContainer) {
      // Clear video container
      videoContainer.innerHTML = '';
      // Show avatar
      avatarContainer.style.display = 'flex';
      console.log('Showing avatar for participant:', userId);
    }
  }

  /**
   * Render remote participant video stream
   */
  private async renderRemoteVideo(stream: any, participantId: any) {
    try {
      const userId = participantId.communicationUserId;

      console.log('Attempting to render remote video for:', userId);
      console.log('Stream isAvailable:', stream.isAvailable);

      if (!stream.isAvailable) {
        console.warn('Stream not available yet, showing avatar instead');
        this.showRemoteParticipantAvatar(participantId);
        return;
      }

      const renderer = new VideoStreamRenderer(stream);
      const view = await renderer.createView();

      console.log('Remote view.target:', view.target);
      console.log('Remote view.target type:', view.target.tagName);

      const videoContainer = document.getElementById(`remote-video-container-${userId}`);
      const avatarContainer = document.getElementById(`remote-avatar-${userId}`);

      if (videoContainer) {
        // Clear container and add video
        videoContainer.innerHTML = '';
        const videoElement = view.target as HTMLVideoElement;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        videoContainer.appendChild(videoElement);

        // Hide avatar, show video
        if (avatarContainer) {
          avatarContainer.style.display = 'none';
        }

        console.log('✅ Successfully rendered remote participant video:', userId);
      }

      // Store renderer for cleanup
      this.remoteParticipantStreams.set(userId, renderer);

    } catch (err: any) {
      console.error('❌ Failed to render remote video:', err);
      // Show avatar on error
      this.showRemoteParticipantAvatar(participantId);
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
      // Check actual call mute state (use Azure SDK as source of truth)
      const isCurrentlyMuted = this.call.isMuted;

      if (isCurrentlyMuted) {
        console.log('Unmuting microphone...');
        await this.call.unmute();
        this.isMuted.set(false);
        console.log('✅ Microphone unmuted');
      } else {
        console.log('Muting microphone...');
        await this.call.mute();
        this.isMuted.set(true);
        console.log('✅ Microphone muted');
      }
    } catch (err: any) {
      console.error('❌ Failed to toggle mute:', err);
      // Sync UI state with actual state
      if (this.call) {
        this.isMuted.set(this.call.isMuted);
        console.log('Synced mute state to:', this.call.isMuted);
      }
    }
  }

  /**
   * Toggle video on/off
   */
  async toggleVideo() {
    if (!this.call) return;

    try {
      // Check if video is actually streaming in the call (use Azure SDK as source of truth)
      const hasActiveVideo = this.call.localVideoStreams && this.call.localVideoStreams.length > 0;

      if (hasActiveVideo) {
        // Video is currently ON - turn it OFF
        console.log('Turning video OFF...');
        if (this.localVideoStream) {
          await this.call.stopVideo(this.localVideoStream);
        }
        this.isVideoOn.set(false);

        // Clear video container to show avatar
        if (this.localVideoContainerRef && this.localVideoContainerRef.nativeElement) {
          this.localVideoContainerRef.nativeElement.innerHTML = '';
        }
        console.log('✅ Video turned off - showing avatar');
      } else {
        // Video is currently OFF - turn it ON
        console.log('Turning video ON...');

        // Create video stream if it doesn't exist
        if (!this.localVideoStream && this.deviceManager) {
          const cameras = await this.deviceManager.getCameras();
          if (cameras.length > 0) {
            this.localVideoStream = new LocalVideoStream(cameras[0]);
          }
        }

        if (this.localVideoStream) {
          await this.call.startVideo(this.localVideoStream);
          this.isVideoOn.set(true);

          // Re-render video
          await this.renderLocalVideo();
          console.log('✅ Video turned on - showing camera');
        }
      }
    } catch (err: any) {
      console.error('❌ Failed to toggle video:', err);
      // Sync UI state with actual state
      if (this.call) {
        const hasActiveVideo = this.call.localVideoStreams && this.call.localVideoStreams.length > 0;
        this.isVideoOn.set(hasActiveVideo);
        console.log('Synced video state to:', hasActiveVideo);
      }
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

    // Dispose local video renderer
    if (this.localVideoRenderer) {
      this.localVideoRenderer.dispose();
      this.localVideoRenderer = undefined;
    }

    // Dispose preview video renderer
    if (this.previewVideoRenderer) {
      this.previewVideoRenderer.dispose();
      this.previewVideoRenderer = undefined;
    }

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
