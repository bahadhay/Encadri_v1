export interface ProjectDocument {
  id?: string;
  projectId: string;
  fileName: string;
  originalFileName: string;
  fileSize: number; // in bytes
  fileType: string; // MIME type
  fileExtension: string; // .pdf, .docx, etc.
  category: DocumentCategory;
  blobUrl: string; // Azure Blob Storage URL
  blobName: string; // Unique blob name in storage
  uploadedBy: string; // User email
  uploadedByName?: string; // User display name
  uploadDate: Date | string;
  description?: string;
  tags?: string[];
  version?: number;
  isApproved?: boolean;
  approvedBy?: string;
  approvalDate?: Date | string;
  downloadCount?: number;
  lastDownloadDate?: Date | string;
}

export type DocumentCategory =
  | 'reports' // Cahier des charges, Rapport final, etc.
  | 'code' // Source code, technical docs
  | 'design' // Mockups, Wireframes, UI/UX
  | 'presentations' // PowerPoint, PDF slides
  | 'meetings' // Meeting notes, agendas
  | 'screenshots' // Screenshots & Images
  | 'research' // Research & References
  | 'deliverables' // Final deliverables
  | 'other'; // Uncategorized

export interface DocumentCategoryInfo {
  key: DocumentCategory;
  label: string;
  icon: string;
  description: string;
  acceptedTypes?: string[]; // MIME types
}

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, { label: string; icon: string; description: string; acceptedTypes?: string[] }> = {
  reports: {
    label: 'Reports',
    icon: '📄',
    description: 'Cahier des charges, Rapport final, etc.',
    acceptedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
  },
  code: {
    label: 'Code & Technical Docs',
    icon: '💻',
    description: 'Source code, technical documentation',
    acceptedTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'text/plain']
  },
  design: {
    label: 'Design Files',
    icon: '🎨',
    description: 'Mockups, Wireframes, UI/UX designs',
    acceptedTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf', 'image/gif']
  },
  presentations: {
    label: 'Presentations',
    icon: '📊',
    description: 'PowerPoint, PDF slides',
    acceptedTypes: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
  },
  meetings: {
    label: 'Meeting Notes',
    icon: '📋',
    description: 'Meeting notes, agendas, minutes',
    acceptedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
  },
  screenshots: {
    label: 'Screenshots & Images',
    icon: '📷',
    description: 'Screenshots, diagrams, images',
    acceptedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp']
  },
  research: {
    label: 'Research & References',
    icon: '📝',
    description: 'Research papers, references, articles',
    acceptedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  },
  deliverables: {
    label: 'Deliverables',
    icon: '✅',
    description: 'Final project deliverables',
    acceptedTypes: [] // Accept all types
  },
  other: {
    label: 'Other',
    icon: '📁',
    description: 'Uncategorized files',
    acceptedTypes: [] // Accept all types
  }
};

export interface DocumentUploadRequest {
  projectId: string;
  file: File;
  category: DocumentCategory;
  description?: string;
  tags?: string[];
}

export interface DocumentUploadResponse {
  document: ProjectDocument;
  success: boolean;
  message?: string;
}

export interface DocumentFilter {
  projectId: string;
  category?: DocumentCategory;
  searchTerm?: string;
  uploadedBy?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  fileType?: string;
  minSize?: number;
  maxSize?: number;
  tags?: string[];
}

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100 MB
  MAX_TOTAL_SIZE: 1024 * 1024 * 1024, // 1 GB per project
  WARNING_SIZE: 50 * 1024 * 1024 // 50 MB - show warning
};

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to get file icon based on extension
export function getFileIcon(extension: string): string {
  const ext = extension.toLowerCase().replace('.', '');
  const iconMap: Record<string, string> = {
    // Documents
    'pdf': '📕',
    'doc': '📘',
    'docx': '📘',
    'txt': '📝',
    'md': '📝',

    // Spreadsheets
    'xls': '📗',
    'xlsx': '📗',
    'csv': '📊',

    // Presentations
    'ppt': '📙',
    'pptx': '📙',

    // Images
    'png': '🖼️',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'gif': '🖼️',
    'svg': '🎨',

    // Archives
    'zip': '🗜️',
    'rar': '🗜️',
    '7z': '🗜️',

    // Code
    'js': '💻',
    'ts': '💻',
    'html': '🌐',
    'css': '🎨',
    'json': '📋',

    // Video
    'mp4': '🎥',
    'avi': '🎥',
    'mov': '🎥'
  };

  return iconMap[ext] || '📄';
}

// Helper function to check if file type is allowed
export function isFileTypeAllowed(file: File, category: DocumentCategory): boolean {
  const categoryInfo = DOCUMENT_CATEGORIES[category];

  // If no specific types defined, allow all
  if (!categoryInfo.acceptedTypes || categoryInfo.acceptedTypes.length === 0) {
    return true;
  }

  // Check if file MIME type matches accepted types
  return categoryInfo.acceptedTypes.includes(file.type);
}
