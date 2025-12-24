import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { ApiService } from './api.service';
import {
  ProjectDocument,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentFilter,
  FILE_SIZE_LIMITS
} from '../models/document.model';

export interface UploadProgress {
  file: File;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  document?: ProjectDocument;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private readonly BASE_PATH = '/documents';

  /**
   * Get all documents for a project
   */
  getDocuments(projectId: string): Observable<ProjectDocument[]> {
    return this.apiService.get<ProjectDocument[]>(`${this.BASE_PATH}/project/${projectId}`);
  }

  /**
   * Get documents by filter
   */
  getDocumentsByFilter(filter: DocumentFilter): Observable<ProjectDocument[]> {
    return this.apiService.post<ProjectDocument[]>(`${this.BASE_PATH}/filter`, filter);
  }

  /**
   * Get a single document by ID
   */
  getDocument(documentId: string): Observable<ProjectDocument> {
    return this.apiService.get<ProjectDocument>(`${this.BASE_PATH}/${documentId}`);
  }

  /**
   * Upload a single document with progress tracking
   */
  uploadDocument(request: DocumentUploadRequest): Observable<UploadProgress> {
    // Validate file size
    if (request.file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
      return throwError(() => new Error(`File size exceeds maximum allowed size of ${FILE_SIZE_LIMITS.MAX_FILE_SIZE / 1024 / 1024} MB`));
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('projectId', request.projectId);
    formData.append('category', request.category);
    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.tags && request.tags.length > 0) {
      formData.append('tags', JSON.stringify(request.tags));
    }

    // Create HTTP request with progress tracking
    const req = new HttpRequest('POST', `${this.apiService['apiUrl']}${this.BASE_PATH}/upload`, formData, {
      reportProgress: true
    });

    // Track upload progress
    return this.http.request<DocumentUploadResponse>(req).pipe(
      map(event => {
        return this.getUploadProgress(event, request.file);
      }),
      catchError(error => {
        console.error('Upload error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload multiple documents with progress tracking
   */
  uploadMultipleDocuments(requests: DocumentUploadRequest[]): Observable<UploadProgress[]> {
    // This would typically be handled by uploading files one by one or in batches
    // For now, we'll return an error indicating batch upload needs backend support
    throw new Error('Batch upload not yet implemented - upload files one at a time');
  }

  /**
   * Update document metadata (description, tags, category)
   */
  updateDocument(documentId: string, updates: Partial<ProjectDocument>): Observable<ProjectDocument> {
    return this.apiService.patch<ProjectDocument>(`${this.BASE_PATH}/${documentId}`, updates);
  }

  /**
   * Delete a document
   */
  deleteDocument(documentId: string): Observable<void> {
    return this.apiService.delete<void>(`${this.BASE_PATH}/${documentId}`);
  }

  /**
   * Download a document
   */
  downloadDocument(doc: ProjectDocument): void {
    // Create a temporary anchor element and trigger download
    const link = window.document.createElement('a');
    link.href = doc.blobUrl;
    link.download = doc.originalFileName;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);

    // Track download
    this.trackDownload(doc.id!).subscribe({
      next: () => console.log('Download tracked'),
      error: (err) => console.error('Failed to track download', err)
    });
  }

  /**
   * Get download URL for a document
   */
  getDownloadUrl(documentId: string): Observable<string> {
    return this.apiService.get<{ url: string }>(`${this.BASE_PATH}/${documentId}/download-url`).pipe(
      map(response => response.url)
    );
  }

  /**
   * Track document download
   */
  private trackDownload(documentId: string): Observable<void> {
    return this.apiService.post<void>(`${this.BASE_PATH}/${documentId}/track-download`, {});
  }

  /**
   * Approve a document (supervisor only)
   */
  approveDocument(documentId: string): Observable<ProjectDocument> {
    return this.apiService.post<ProjectDocument>(`${this.BASE_PATH}/${documentId}/approve`, {});
  }

  /**
   * Reject a document (supervisor only)
   */
  rejectDocument(documentId: string, reason?: string): Observable<ProjectDocument> {
    return this.apiService.post<ProjectDocument>(`${this.BASE_PATH}/${documentId}/reject`, { reason });
  }

  /**
   * Get total storage used by a project
   */
  getProjectStorageUsage(projectId: string): Observable<{ totalSize: number; documentCount: number }> {
    return this.apiService.get<{ totalSize: number; documentCount: number }>(`${this.BASE_PATH}/project/${projectId}/storage`);
  }

  /**
   * Search documents
   */
  searchDocuments(projectId: string, searchTerm: string): Observable<ProjectDocument[]> {
    return this.apiService.get<ProjectDocument[]>(`${this.BASE_PATH}/project/${projectId}/search`, {
      q: searchTerm
    });
  }

  /**
   * Helper to calculate upload progress from HTTP event
   */
  private getUploadProgress(event: HttpEvent<DocumentUploadResponse>, file: File): UploadProgress {
    switch (event.type) {
      case HttpEventType.Sent:
        return {
          file,
          progress: 0,
          status: 'pending'
        };

      case HttpEventType.UploadProgress:
        const progress = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
        return {
          file,
          progress,
          status: 'uploading'
        };

      case HttpEventType.Response:
        if (event.body?.success) {
          return {
            file,
            progress: 100,
            status: 'completed',
            document: event.body.document
          };
        } else {
          return {
            file,
            progress: 0,
            status: 'error',
            error: event.body?.message || 'Upload failed'
          };
        }

      default:
        return {
          file,
          progress: 0,
          status: 'pending'
        };
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size of ${FILE_SIZE_LIMITS.MAX_FILE_SIZE / 1024 / 1024} MB`
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    return { valid: true };
  }
}
