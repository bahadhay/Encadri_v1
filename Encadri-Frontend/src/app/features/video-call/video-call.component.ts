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
  isMuted = signal(false); // Start with mic ON (Microsoft Teams standard)
  isVideoOn = signal(true); // Start with camera ON (Microsoft Teams standard)
  previewVideoRendered = false;

  // Loading states for toggles (prevent rapid successive clicks)
  isTogglingVideo = false;
  isTogglingMute = false;

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
      // Clean up preview video stream and renderer before joining call
      if (this.previewVideoRenderer) {
        this.previewVideoRenderer.dispose();
        this.previewVideoRenderer = undefined;
        console.log('Cleaned up preview renderer');
      }
      if (this.previewVideoContainerRef && this.previewVideoContainerRef.nativeElement) {
        this.previewVideoContainerRef.nativeElement.innerHTML = '';
      }
      this.previewVideoRendered = false;

      // Get cameras
      const cameras = await this.deviceManager.getCameras();
      if (cameras.length === 0 && this.isVideoOn()) {
        throw new Error('No camera found');
      }

      // Create fresh local video stream for the call (don't reuse preview stream)
      const localVideoStreams = [];
      if (this.isVideoOn()) {
        // Create a fresh LocalVideoStream for the call
        this.localVideoStream = new LocalVideoStream(cameras[0]);
        localVideoStreams.push(this.localVideoStream);
        console.log('Created fresh video stream for call');
      } else {
        // Ensure no leftover stream if camera is off
        this.localVideoStream = undefined;
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

      console.log('Call object created, waiting for connection...');

      // Subscribe to call events
      this.subscribeToCall(this.call);

      // Wait a moment for call to establish before rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Render local video only if camera is on
      if (this.isVideoOn() && this.localVideoStream) {
        await this.renderLocalVideo();
      }

      this.isCallActive.set(true);
      this.isConnecting.set(false);

      console.log('✅ Joined call successfully');
      console.log('   Call state:', this.call.state);
      console.log('   Camera:', this.isVideoOn());
      console.log('   Mic:', this.isMuted() ? 'muted' : 'unmuted');

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
    console.log('=== SUBSCRIBING TO CALL EVENTS ===');
    console.log('   Meeting/Group ID:', this.meetingId);
    console.log('   Initial call state:', call.state);
    console.log('   Initial remote participants:', call.remoteParticipants.length);

    // Listen for state changes
    call.on('stateChanged', () => {
      console.log('📞 Call state changed to:', call.state);
      if (call.state === 'Disconnected') {
        this.isCallActive.set(false);
        console.log('Call disconnected, cleaning up...');
      }
      if (call.state === 'Connected') {
        console.log('✅ Call fully connected!');
        console.log('   Remote participants in call:', call.remoteParticipants.length);
      }
    });

    // Listen for remote participants
    call.on('remoteParticipantsUpdated', (e: any) => {
      console.log('👥 Remote participants updated:');
      console.log('   Participants added:', e.added.length);
      console.log('   Participants removed:', e.removed.length);
      console.log('   Total remote participants now:', call.remoteParticipants.length);

      // Participants added
      e.added.forEach((participant: RemoteParticipant) => {
        console.log('   ➕ New participant joined:', {
          id: (participant.identifier as any).communicationUserId || 'unknown',
          state: participant.state,
          isMuted: participant.isMuted,
          videoStreams: participant.videoStreams.length
        });
        this.subscribeToRemoteParticipant(participant);
        this.updateParticipantCount();
      });

      // Participants removed
      e.removed.forEach((participant: RemoteParticipant) => {
        const participantId = (participant.identifier as any).communicationUserId || 'unknown';
        console.log('   ➖ Participant left:', participantId);
        this.removeRemoteParticipantVideo(participant.identifier);
        this.updateParticipantCount();
      });
    });

    // Handle existing participants (already in the call when we join)
    console.log('Checking for existing participants in call...');
    if (call.remoteParticipants.length > 0) {
      console.log(`Found ${call.remoteParticipants.length} existing participant(s) - subscribing to them...`);
      call.remoteParticipants.forEach((participant: RemoteParticipant) => {
        console.log('   Subscribing to existing participant:', (participant.identifier as any).communicationUserId || 'unknown');
        this.subscribeToRemoteParticipant(participant);
      });
    } else {
      console.log('No existing participants in call yet. Waiting for others to join...');
    }

    this.updateParticipantCount();
    console.log('=== CALL EVENT SUBSCRIPTION COMPLETE ===');

    // CRITICAL FIX: Poll for participants periodically
    // Azure SDK sometimes fails to fire remoteParticipantsUpdated when users join without media
    // Poll every 2 seconds for the first 30 seconds to catch late-joining participants
    this.startParticipantPolling();
  }

  /**
   * Poll for remote participants to detect them even without media streams
   */
  private participantPollingInterval?: any;
  private startParticipantPolling() {
    let pollCount = 0;
    const maxPolls = 15; // Poll for 30 seconds (15 * 2s)

    console.log('🔄 Starting participant polling (every 2s for 30s)');

    this.participantPollingInterval = setInterval(() => {
      pollCount++;

      if (!this.call || pollCount > maxPolls) {
        console.log('🛑 Stopping participant polling');
        if (this.participantPollingInterval) {
          clearInterval(this.participantPollingInterval);
          this.participantPollingInterval = undefined;
        }
        return;
      }

      const currentCount = this.call.remoteParticipants.length;
      console.log(`🔍 Poll ${pollCount}/${maxPolls}: Checking for participants... Found: ${currentCount}`);

      // Check if there are any unsubscribed participants
      this.call.remoteParticipants.forEach((participant: RemoteParticipant) => {
        const participantId = (participant.identifier as any).communicationUserId;
        const tileExists = document.getElementById(`remote-${participantId}`);

        if (!tileExists) {
          console.log(`   ➕ Found unsubscribed participant via polling: ${participantId}`);
          this.subscribeToRemoteParticipant(participant);
          this.updateParticipantCount();
        }
      });
    }, 2000); // Poll every 2 seconds
  }

  /**
   * Subscribe to remote participant video streams
   */
  private subscribeToRemoteParticipant(participant: RemoteParticipant) {
    const participantId = (participant.identifier as any).communicationUserId || 'unknown';
    console.log(`📹 Subscribing to participant: ${participantId}`);
    console.log('   Participant state:', participant.state);
    console.log('   Has video streams:', participant.videoStreams.length);
    console.log('   Is muted:', participant.isMuted);

    // Create participant tile immediately (with or without video)
    this.createRemoteParticipantTile(participant);

    // Listen for participant state changes
    participant.on('stateChanged', () => {
      console.log(`   Participant ${participantId} state changed to:`, participant.state);
    });

    participant.on('videoStreamsUpdated', async (e: any) => {
      console.log(`   📹 Video streams updated for ${participantId}:`);
      console.log('      Added:', e.added.length, 'Removed:', e.removed.length);

      // Video streams added (participant turned on camera)
      e.added.forEach(async (stream: any) => {
        console.log(`      ➕ Stream added - isAvailable: ${stream.isAvailable}`);

        // Subscribe to isAvailable changes
        stream.on('isAvailableChanged', async () => {
          console.log(`      Stream availability changed for ${participantId}:`, stream.isAvailable);
          if (stream.isAvailable) {
            await this.renderRemoteVideo(stream, participant.identifier);
          } else {
            this.showRemoteParticipantAvatar(participant.identifier);
          }
        });

        // Render immediately if already available
        if (stream.isAvailable) {
          console.log(`      Rendering stream immediately for ${participantId}`);
          await this.renderRemoteVideo(stream, participant.identifier);
        }
      });

      // Video streams removed (participant turned off camera)
      e.removed.forEach((stream: any) => {
        console.log(`      ➖ Stream removed for ${participantId} - showing avatar`);
        this.showRemoteParticipantAvatar(participant.identifier);
      });
    });

    // Render existing video streams or show avatar
    if (participant.videoStreams && participant.videoStreams.length > 0) {
      console.log(`   Processing ${participant.videoStreams.length} existing video stream(s) for ${participantId}`);
      participant.videoStreams.forEach(async (stream: any) => {
        console.log(`      Stream isAvailable: ${stream.isAvailable}`);

        // Subscribe to isAvailable changes
        stream.on('isAvailableChanged', async () => {
          console.log(`      Stream availability changed for ${participantId}:`, stream.isAvailable);
          if (stream.isAvailable) {
            await this.renderRemoteVideo(stream, participant.identifier);
          } else {
            this.showRemoteParticipantAvatar(participant.identifier);
          }
        });

        // Render immediately if already available
        if (stream.isAvailable) {
          console.log(`      Rendering existing stream for ${participantId}`);
          await this.renderRemoteVideo(stream, participant.identifier);
        } else {
          // Stream exists but not available yet, show avatar
          console.log(`      Stream not available yet for ${participantId} - showing avatar`);
          this.showRemoteParticipantAvatar(participant.identifier);
        }
      });
    } else {
      // No video stream, show avatar
      console.log(`   No video streams for ${participantId} - showing avatar`);
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
    console.log(`🎨 Creating tile for participant: ${participantId}`);

    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) {
      console.error('   ❌ Video grid not found! Cannot create participant tile.');
      return;
    }

    // Check if tile already exists
    if (document.getElementById(`remote-${participantId}`)) {
      console.log(`   ℹ️ Tile already exists for ${participantId}, skipping creation`);
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

    // Create avatar container (visible by default since most join with camera off)
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'video-avatar';
    avatarContainer.id = `remote-avatar-${participantId}`;
    avatarContainer.style.display = 'flex'; // Show by default
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

    console.log(`   ✅ Created remote participant tile for: ${participantId}`);
    console.log('   Total participant tiles in DOM:', document.querySelectorAll('.remote-video').length);
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
    if (!this.call) {
      console.warn('Cannot toggle mute: no active call');
      return;
    }

    // Prevent multiple simultaneous toggle operations
    if (this.isTogglingMute) {
      console.log('Toggle mute already in progress, ignoring...');
      return;
    }

    // Check if call is in a valid state for audio operations
    // Allow if call is Connected, Connecting, or even None (some calls work in None state)
    const invalidStates = ['Disconnected', 'Disconnecting'];
    if (invalidStates.includes(this.call.state)) {
      console.warn('Cannot toggle mute: call is disconnected. Current state:', this.call.state);
      this.error.set('Call is disconnected');
      setTimeout(() => this.error.set(''), 3000);
      return;
    }

    // If not yet connected, warn but allow the attempt
    if (this.call.state !== 'Connected' && this.call.state !== 'Connecting') {
      console.warn('⚠️ Attempting toggle in state:', this.call.state, '(may work anyway)');
    }

    this.isTogglingMute = true;

    try {
      // Check actual call mute state (use Azure SDK as source of truth)
      const isCurrentlyMuted = this.call.isMuted;
      console.log('Current mute state:', isCurrentlyMuted);

      if (isCurrentlyMuted) {
        console.log('Unmuting microphone...');
        await this.call.unmute();

        // Verify unmute succeeded by checking state after a brief delay
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!this.call.isMuted) {
          this.isMuted.set(false);
          console.log('✅ Microphone unmuted');
        } else {
          console.warn('⚠️ Unmute command executed but state still shows muted');
          this.isMuted.set(this.call.isMuted);
        }
      } else {
        console.log('Muting microphone...');
        await this.call.mute();

        // Verify mute succeeded by checking state after a brief delay
        await new Promise(resolve => setTimeout(resolve, 100));

        if (this.call.isMuted) {
          this.isMuted.set(true);
          console.log('✅ Microphone muted');
        } else {
          console.warn('⚠️ Mute command executed but state still shows unmuted');
          this.isMuted.set(this.call.isMuted);
        }
      }
    } catch (err: any) {
      console.error('❌ Failed to toggle mute:', err);
      console.error('   Error details:', err.message, err.code);

      // Sync UI state with actual state
      if (this.call) {
        this.isMuted.set(this.call.isMuted);
        console.log('   Synced mute state to:', this.call.isMuted);
      }

      // Show user-friendly error
      this.error.set('Failed to toggle microphone. Please try again.');
      setTimeout(() => this.error.set(''), 3000);
    } finally {
      this.isTogglingMute = false;
    }
  }

  /**
   * Toggle video on/off
   */
  async toggleVideo() {
    if (!this.call) {
      console.warn('Cannot toggle video: no active call');
      return;
    }

    // Prevent multiple simultaneous toggle operations
    if (this.isTogglingVideo) {
      console.log('Toggle video already in progress, ignoring...');
      return;
    }

    // Check if call is in a valid state for video operations
    // Allow if call is Connected, Connecting, or even None (some calls work in None state)
    const invalidStates = ['Disconnected', 'Disconnecting'];
    if (invalidStates.includes(this.call.state)) {
      console.warn('Cannot toggle video: call is disconnected. Current state:', this.call.state);
      this.error.set('Call is disconnected');
      setTimeout(() => this.error.set(''), 3000);
      return;
    }

    // If not yet connected, warn but allow the attempt
    if (this.call.state !== 'Connected' && this.call.state !== 'Connecting') {
      console.warn('⚠️ Attempting video toggle in state:', this.call.state, '(may work anyway)');
    }

    this.isTogglingVideo = true;

    try {
      // Check if video is actually streaming in the call (use Azure SDK as source of truth)
      const hasActiveVideo = this.call.localVideoStreams && this.call.localVideoStreams.length > 0;
      console.log('Current video state - hasActiveVideo:', hasActiveVideo);
      console.log('   localVideoStreams count:', this.call.localVideoStreams?.length || 0);

      if (hasActiveVideo) {
        // Video is currently ON - turn it OFF
        console.log('Turning video OFF...');

        // IMPORTANT: Use ALL streams in the array, not just the first one
        // Copy array to avoid modification during iteration
        const streamsToStop = [...this.call.localVideoStreams];
        console.log('   Stopping', streamsToStop.length, 'stream(s)');

        for (const stream of streamsToStop) {
          try {
            await this.call.stopVideo(stream);
            console.log('   ✓ Stopped stream');
          } catch (err: any) {
            // If already stopped, ignore the error
            if (err.message?.includes('already stopped')) {
              console.log('   ℹ️ Stream already stopped, ignoring');
            } else {
              throw err; // Re-throw other errors
            }
          }
        }

        // CRITICAL: Wait for stream to be removed from call.localVideoStreams[]
        // Mirror the logic from turning ON - wait for state to sync
        let streamRemoved = false;
        let attempts = 0;
        while (!streamRemoved && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms
          streamRemoved = !this.call.localVideoStreams || this.call.localVideoStreams.length === 0;
          attempts++;
          if (streamRemoved) {
            console.log('   ✓ Stream removed from call.localVideoStreams[] after', attempts * 50, 'ms');
          }
        }

        if (!streamRemoved) {
          console.warn('   ⚠️ Stream still in call.localVideoStreams[] after 1 second');
          console.warn('   ⚠️ Forcing state update anyway');
        }

        // Update state
        this.isVideoOn.set(false);
        this.localVideoStream = undefined;

        // Clear video container to show avatar
        if (this.localVideoContainerRef && this.localVideoContainerRef.nativeElement) {
          this.localVideoContainerRef.nativeElement.innerHTML = '';
        }

        // Dispose renderer
        if (this.localVideoRenderer) {
          this.localVideoRenderer.dispose();
          this.localVideoRenderer = undefined;
          console.log('   Disposed video renderer');
        }

        console.log('✅ Video turned off - showing avatar');
      } else {
        // Video is currently OFF - turn it ON
        console.log('Turning video ON...');

        // Create a fresh video stream
        if (!this.deviceManager) {
          throw new Error('Device manager not available');
        }

        const cameras = await this.deviceManager.getCameras();
        if (cameras.length === 0) {
          throw new Error('No camera found');
        }

        // Create fresh LocalVideoStream
        const newStream = new LocalVideoStream(cameras[0]);
        console.log('   Created fresh LocalVideoStream');

        // Start video in the call
        await this.call.startVideo(newStream);
        console.log('   Started video in call');

        // CRITICAL FIX: Wait for stream to appear in call.localVideoStreams[]
        // This ensures Azure SDK has fully registered the stream
        let streamRegistered = false;
        let attempts = 0;
        while (!streamRegistered && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms
          streamRegistered = this.call.localVideoStreams &&
                            this.call.localVideoStreams.length > 0 &&
                            this.call.localVideoStreams.some(s => s === newStream);
          attempts++;
          if (streamRegistered) {
            console.log('   ✓ Stream registered in call.localVideoStreams[] after', attempts * 50, 'ms');
          }
        }

        if (!streamRegistered) {
          console.warn('   ⚠️ Stream not found in call.localVideoStreams[] after 1 second, proceeding anyway');
        }

        // IMPORTANT: Store the stream reference that's now in the call
        this.localVideoStream = newStream;
        this.isVideoOn.set(true);

        // Render video
        await this.renderLocalVideo();
        console.log('✅ Video turned on - showing camera');
      }
    } catch (err: any) {
      console.error('❌ Failed to toggle video:', err);
      console.error('   Error details:', err.message, err.code);

      // Sync UI state with actual state
      if (this.call) {
        const hasActiveVideo = this.call.localVideoStreams && this.call.localVideoStreams.length > 0;
        this.isVideoOn.set(hasActiveVideo);
        console.log('   Synced video state to:', hasActiveVideo);
      }

      // Show user-friendly error
      this.error.set('Failed to toggle camera. Please try again.');
      setTimeout(() => this.error.set(''), 3000);
    } finally {
      this.isTogglingVideo = false;
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
    // Stop participant polling
    if (this.participantPollingInterval) {
      clearInterval(this.participantPollingInterval);
      this.participantPollingInterval = undefined;
      console.log('Cleaned up participant polling');
    }

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
