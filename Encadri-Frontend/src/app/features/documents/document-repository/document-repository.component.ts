import { Component, inject, signal, Input, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService, UploadProgress } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ProjectDocument,
  DocumentCategory,
  DOCUMENT_CATEGORIES,
  formatFileSize,
  getFileIcon,
  isFileTypeAllowed,
  FILE_SIZE_LIMITS
} from '../../../core/models/document.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FilePreviewComponent } from '../../../shared/components/file-preview/file-preview.component';
import { SkeletonTableComponent } from '../../../shared/components/skeleton-table/skeleton-table.component';

@Component({
  selector: 'app-document-repository',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiCardComponent,
    UiButtonComponent,
    UiInputComponent,
    ModalComponent,
    ConfirmDialogComponent,
    FilePreviewComponent,
    SkeletonTableComponent
  ],
  templateUrl: './document-repository.component.html',
  styleUrls: ['./document-repository.component.css']
})
export class DocumentRepositoryComponent implements OnInit {
  @Input() projectId!: string;

  private documentService = inject(DocumentService);
  private authService = inject(AuthService);

  // State
  documents = signal<ProjectDocument[]>([]);
  loading = signal<boolean>(true);
  uploadingFiles = signal<UploadProgress[]>([]);

  // Filters
  selectedCategory = signal<DocumentCategory | 'all'>('all');
  searchTerm = signal<string>('');
  viewMode = signal<'list' | 'grid'>('list');

  // Upload modal
  isUploadModalOpen = signal<boolean>(false);
  uploadForm = signal<{
    files: File[];
    category: DocumentCategory;
    description: string;
  }>({
    files: [],
    category: 'other',
    description: ''
  });

  // Delete confirmation
  isDeleteDialogOpen = signal<boolean>(false);
  documentToDelete: ProjectDocument | null = null;
  deleteLoading = signal<boolean>(false);

  // Preview modal
  isPreviewOpen = signal<boolean>(false);
  documentToPreview: ProjectDocument | null = null;

  // Storage info
  storageInfo = signal<{ totalSize: number; documentCount: number }>({
    totalSize: 0,
    documentCount: 0
  });

  // Drag and drop state
  isDragging = signal<boolean>(false);

  // Category accordion state
  expandedCategories = signal<Set<DocumentCategory>>(new Set());

  // Mobile actions menu state
  activeMobileMenu: string | null = null;

  // Category list
  categories = Object.keys(DOCUMENT_CATEGORIES).map(key => ({
    key: key as DocumentCategory,
    ...DOCUMENT_CATEGORIES[key as DocumentCategory]
  }));

  ngOnInit() {
    if (this.projectId) {
      this.loadDocuments();
      this.loadStorageInfo();
    }
  }

  // Close mobile menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-cell')) {
      this.closeMobileMenu();
    }
  }

  loadDocuments() {
    this.loading.set(true);
    this.documentService.getDocuments(this.projectId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load documents', err);
        this.loading.set(false);
      }
    });
  }

  loadStorageInfo() {
    this.documentService.getProjectStorageUsage(this.projectId).subscribe({
      next: (info) => {
        this.storageInfo.set(info);
      },
      error: (err) => {
        console.error('Failed to load storage info', err);
      }
    });
  }

  get filteredDocuments(): ProjectDocument[] {
    let filtered = this.documents();

    // Filter by category
    if (this.selectedCategory() !== 'all') {
      filtered = filtered.filter(doc => doc.category === this.selectedCategory());
    }

    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(doc =>
        doc.fileName.toLowerCase().includes(search) ||
        doc.originalFileName.toLowerCase().includes(search) ||
        doc.description?.toLowerCase().includes(search) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    return filtered;
  }

  get documentsByCategory(): Record<DocumentCategory, ProjectDocument[]> {
    const byCategory: any = {};
    this.categories.forEach(cat => {
      byCategory[cat.key] = this.documents().filter(doc => doc.category === cat.key);
    });
    return byCategory;
  }

  // Drag and drop handlers
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(Array.from(files));
    }
  }

  // File input handler
  onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(Array.from(input.files));
    }
  }

  handleFileSelection(files: File[]) {
    // Validate files
    const validFiles = files.filter(file => {
      const validation = this.documentService.validateFile(file);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      // Add to existing files instead of replacing
      this.uploadForm.update(form => ({
        ...form,
        files: [...form.files, ...validFiles]
      }));
      this.isUploadModalOpen.set(true);
    }
  }

  // Remove a specific file from selection
  removeFile(index: number) {
    this.uploadForm.update(form => ({
      ...form,
      files: form.files.filter((_, i) => i !== index)
    }));
  }

  // Clear all selected files
  clearSelectedFiles() {
    this.uploadForm.update(form => ({
      ...form,
      files: []
    }));
  }

  uploadDocuments() {
    const form = this.uploadForm();
    if (form.files.length === 0) return;

    // Upload each file
    form.files.forEach(file => {
      const uploadRequest = {
        projectId: this.projectId,
        file,
        category: form.category,
        description: form.description
      };

      this.documentService.uploadDocument(uploadRequest).subscribe({
        next: (progress) => {
          // Update upload progress
          this.updateUploadProgress(progress);

          // If completed, reload documents
          if (progress.status === 'completed') {
            this.loadDocuments();
            this.loadStorageInfo();
          }
        },
        error: (err) => {
          console.error('Upload failed', err);
          alert(`Failed to upload ${file.name}`);
        }
      });
    });

    // Close modal and reset form
    this.isUploadModalOpen.set(false);
    this.uploadForm.set({
      files: [],
      category: 'other',
      description: ''
    });
  }

  private updateUploadProgress(progress: UploadProgress) {
    this.uploadingFiles.update(files => {
      const existing = files.findIndex(f => f.file.name === progress.file.name);
      if (existing >= 0) {
        files[existing] = progress;
      } else {
        files.push(progress);
      }
      // Remove completed/error files after 3 seconds
      if (progress.status === 'completed' || progress.status === 'error') {
        setTimeout(() => {
          this.uploadingFiles.update(current =>
            current.filter(f => f.file.name !== progress.file.name)
          );
        }, 3000);
      }
      return [...files];
    });
  }

  downloadDocument(doc: ProjectDocument) {
    this.documentService.downloadDocument(doc);
  }

  previewDocument(doc: ProjectDocument) {
    this.documentToPreview = doc;
    this.isPreviewOpen.set(true);
  }

  closePreview() {
    this.isPreviewOpen.set(false);
    this.documentToPreview = null;
  }

  openDeleteDialog(doc: ProjectDocument) {
    this.documentToDelete = doc;
    this.isDeleteDialogOpen.set(true);
  }

  closeDeleteDialog() {
    this.isDeleteDialogOpen.set(false);
    this.documentToDelete = null;
  }

  confirmDelete() {
    if (!this.documentToDelete?.id) return;

    this.deleteLoading.set(true);
    this.documentService.deleteDocument(this.documentToDelete.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.closeDeleteDialog();
        this.loadDocuments();
        this.loadStorageInfo();
      },
      error: (err) => {
        console.error('Failed to delete document', err);
        alert('Failed to delete document');
        this.deleteLoading.set(false);
      }
    });
  }

  // Helper methods
  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  getFileIcon(extension: string): string {
    return getFileIcon(extension);
  }

  getCategoryIcon(category: DocumentCategory): string {
    return DOCUMENT_CATEGORIES[category].icon;
  }

  getCategoryLabel(category: DocumentCategory): string {
    return DOCUMENT_CATEGORIES[category].label;
  }

  // Get file type color for preview - Simplified subtle colors
  getFileTypeColor(extension: string): string {
    const ext = extension.toLowerCase().replace('.', '');
    const colorMap: Record<string, string> = {
      // Documents
      'pdf': '#9ca3af',
      'doc': '#9ca3af',
      'docx': '#9ca3af',
      'txt': '#9ca3af',
      'md': '#9ca3af',

      // Spreadsheets
      'xls': '#9ca3af',
      'xlsx': '#9ca3af',
      'csv': '#9ca3af',

      // Presentations
      'ppt': '#9ca3af',
      'pptx': '#9ca3af',

      // Images
      'png': '#9ca3af',
      'jpg': '#9ca3af',
      'jpeg': '#9ca3af',
      'gif': '#9ca3af',
      'svg': '#9ca3af',
      'webp': '#9ca3af',

      // Archives
      'zip': '#9ca3af',
      'rar': '#9ca3af',
      '7z': '#9ca3af',

      // Code
      'js': '#9ca3af',
      'ts': '#9ca3af',
      'html': '#9ca3af',
      'css': '#9ca3af',
      'json': '#9ca3af',

      // Video
      'mp4': '#9ca3af',
      'avi': '#9ca3af',
      'mov': '#9ca3af'
    };

    return colorMap[ext] || '#9ca3af';
  }

  // Get file preview type
  getFilePreviewType(doc: ProjectDocument): 'pdf' | 'image' | 'video' | 'document' | 'code' | 'archive' | 'other' {
    const ext = doc.fileExtension.toLowerCase().replace('.', '');

    if (ext === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
    if (['doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
    if (['js', 'ts', 'html', 'css', 'json', 'xml'].includes(ext)) return 'code';
    if (['zip', 'rar', '7z'].includes(ext)) return 'archive';

    return 'other';
  }

  get storagePercentage(): number {
    const used = this.storageInfo().totalSize;
    const max = FILE_SIZE_LIMITS.MAX_TOTAL_SIZE;
    return Math.round((used / max) * 100);
  }

  get isSupervisor(): boolean {
    const user = this.authService.currentUser();
    return user?.userRole === 'supervisor';
  }

  get isStudent(): boolean {
    const user = this.authService.currentUser();
    return user?.userRole === 'student';
  }

  // Toggle category expansion
  toggleCategory(category: DocumentCategory) {
    const expanded = this.expandedCategories();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }

    this.expandedCategories.set(newExpanded);
  }

  // Check if category is expanded
  isCategoryExpanded(category: DocumentCategory): boolean {
    return this.expandedCategories().has(category);
  }

  // Expand all categories
  expandAllCategories() {
    const allCategories = new Set(this.categories.map(c => c.key));
    this.expandedCategories.set(allCategories);
  }

  // Collapse all categories
  collapseAllCategories() {
    this.expandedCategories.set(new Set());
  }

  // Get documents count for a category
  getCategoryDocumentCount(category: DocumentCategory): number {
    return this.documentsByCategory[category]?.length || 0;
  }

  // Toggle mobile actions menu
  toggleMobileMenu(documentId: string) {
    if (this.activeMobileMenu === documentId) {
      this.activeMobileMenu = null;
    } else {
      this.activeMobileMenu = documentId;
    }
  }

  // Close mobile menu
  closeMobileMenu() {
    this.activeMobileMenu = null;
  }
}
