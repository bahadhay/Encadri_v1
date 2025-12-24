import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectDocument, formatFileSize } from '../../../core/models/document.model';

export type PreviewType = 'pdf' | 'image' | 'video' | 'text' | 'code' | 'unsupported';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.css']
})
export class FilePreviewComponent implements OnInit, OnDestroy {
  @Input() document!: ProjectDocument;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  loading = signal<boolean>(true);
  error = signal<string>('');
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  zoomLevel = signal<number>(100);

  // For text/code preview
  textContent = signal<string>('');

  // Safe URL for iframe
  safeUrl = signal<SafeResourceUrl | null>(null);

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (this.document) {
      this.loadPreview();
    }
  }

  ngOnDestroy() {
    // Cleanup
    this.loading.set(false);
  }

  get previewType(): PreviewType {
    const ext = this.document.fileExtension.toLowerCase().replace('.', '');
    const mimeType = this.document.fileType.toLowerCase();

    // PDF
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf';
    }

    // Images
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext) ||
        mimeType.startsWith('image/')) {
      return 'image';
    }

    // Videos
    if (['mp4', 'avi', 'mov', 'webm'].includes(ext) ||
        mimeType.startsWith('video/')) {
      return 'video';
    }

    // Text files
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(ext) ||
        mimeType.startsWith('text/')) {
      return 'text';
    }

    // Code files
    if (['js', 'ts', 'html', 'css', 'scss', 'java', 'py', 'cs', 'cpp', 'c', 'h', 'go', 'rs', 'rb', 'php'].includes(ext)) {
      return 'code';
    }

    return 'unsupported';
  }

  get fileIcon(): string {
    switch (this.previewType) {
      case 'pdf': return '📕';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'text': return '📝';
      case 'code': return '💻';
      default: return '📄';
    }
  }

  loadPreview() {
    this.loading.set(true);
    this.error.set('');

    try {
      switch (this.previewType) {
        case 'pdf':
          this.loadPdfPreview();
          break;
        case 'image':
          this.loadImagePreview();
          break;
        case 'video':
          this.loadVideoPreview();
          break;
        case 'text':
        case 'code':
          this.loadTextPreview();
          break;
        default:
          this.error.set('Preview not available for this file type');
          this.loading.set(false);
      }
    } catch (err) {
      console.error('Preview load error:', err);
      this.error.set('Failed to load preview');
      this.loading.set(false);
    }
  }

  loadPdfPreview() {
    try {
      // Check if blobUrl exists
      if (!this.document.blobUrl) {
        this.error.set('File URL is not available');
        this.loading.set(false);
        return;
      }

      // Try direct PDF embedding first, fallback to Google Docs Viewer if needed
      // Direct embedding works better with Azure Blob Storage SAS URLs
      const directUrl = this.document.blobUrl;
      this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(directUrl));
      this.loading.set(false);
    } catch (err) {
      console.error('PDF preview error:', err);
      this.error.set('Failed to load PDF preview');
      this.loading.set(false);
    }
  }

  loadImagePreview() {
    try {
      // Check if blobUrl exists
      if (!this.document.blobUrl) {
        this.error.set('Image URL is not available');
        this.loading.set(false);
        return;
      }

      // For images, we can use the blob URL directly
      this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.document.blobUrl));

      // Test if image loads successfully
      const img = new Image();
      img.onload = () => {
        this.loading.set(false);
      };
      img.onerror = () => {
        this.error.set('Failed to load image. The file may be corrupted or inaccessible.');
        this.loading.set(false);
      };
      img.src = this.document.blobUrl;
    } catch (err) {
      console.error('Image preview error:', err);
      this.error.set('Failed to load image preview');
      this.loading.set(false);
    }
  }

  loadVideoPreview() {
    try {
      // Check if blobUrl exists
      if (!this.document.blobUrl) {
        this.error.set('Video URL is not available');
        this.loading.set(false);
        return;
      }

      // For videos, we can use the blob URL directly
      this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.document.blobUrl));
      this.loading.set(false);
    } catch (err) {
      console.error('Video preview error:', err);
      this.error.set('Failed to load video preview');
      this.loading.set(false);
    }
  }

  async loadTextPreview() {
    try {
      // Check if blobUrl exists
      if (!this.document.blobUrl) {
        this.error.set('File URL is not available');
        this.loading.set(false);
        return;
      }

      const response = await fetch(this.document.blobUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();

      // Check if content is too large (> 1MB)
      if (text.length > 1000000) {
        this.error.set('File is too large to preview (> 1MB). Please download to view.');
        this.loading.set(false);
        return;
      }

      this.textContent.set(text);
      this.loading.set(false);
    } catch (err) {
      console.error('Failed to load text content:', err);
      this.error.set('Failed to load file content. The file may be inaccessible or in an unsupported format.');
      this.loading.set(false);
    }
  }

  closePreview() {
    this.close.emit();
  }

  downloadFile() {
    const link = document.createElement('a');
    link.href = this.document.blobUrl;
    link.download = this.document.originalFileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // PDF Navigation
  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  // Zoom controls
  zoomIn() {
    this.zoomLevel.update(z => Math.min(z + 25, 200));
  }

  zoomOut() {
    this.zoomLevel.update(z => Math.max(z - 25, 50));
  }

  resetZoom() {
    this.zoomLevel.set(100);
  }

  // Print file
  printFile() {
    if (this.previewType === 'pdf' || this.previewType === 'image') {
      window.open(this.document.blobUrl, '_blank')?.print();
    }
  }

  // Share file (copy link)
  shareFile() {
    navigator.clipboard.writeText(this.document.blobUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link');
    });
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  // Get language for syntax highlighting (for code files)
  get codeLanguage(): string {
    const ext = this.document.fileExtension.toLowerCase().replace('.', '');
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'java': 'java',
      'py': 'python',
      'cs': 'csharp',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'md': 'markdown'
    };
    return langMap[ext] || 'text';
  }

  // Fullscreen
  toggleFullscreen() {
    const element = document.querySelector('.preview-modal');
    if (!document.fullscreenElement) {
      element?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  // Handle keyboard shortcuts
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        this.closePreview();
        break;
      case 'ArrowLeft':
        if (this.previewType === 'pdf') this.previousPage();
        break;
      case 'ArrowRight':
        if (this.previewType === 'pdf') this.nextPage();
        break;
      case '+':
      case '=':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.zoomIn();
        }
        break;
      case '-':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.zoomOut();
        }
        break;
      case '0':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.resetZoom();
        }
        break;
    }
  }
}
