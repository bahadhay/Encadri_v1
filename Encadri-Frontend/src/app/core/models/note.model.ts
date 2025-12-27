export interface Note {
  id?: string;
  title: string;
  content: string; // Markdown content
  categoryId?: string;
  folderId?: string;
  color?: string; // default, red, blue, green, yellow, purple, orange, pink
  isPinned: boolean;
  tags?: string[];
  userEmail: string; // Owner of the note (private)
  createdDate?: string;
  updatedDate?: string;
}

export interface NoteCategory {
  id?: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  userEmail: string; // Owner of the category
  createdDate?: string;
  updatedDate?: string;
}

export interface NoteFolder {
  id?: string;
  name: string;
  categoryId?: string; // Parent category (optional for root folders)
  parentFolderId?: string; // For nested folders
  color?: string;
  userEmail: string; // Owner of the folder
  createdDate?: string;
  updatedDate?: string;
}
