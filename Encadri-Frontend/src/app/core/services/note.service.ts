import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Note, NoteCategory, NoteFolder } from '../models/note.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private readonly NOTES_PATH = '/notes';
  private readonly CATEGORIES_PATH = '/notecategories';
  private readonly FOLDERS_PATH = '/notefolders';

  // Notes CRUD
  getNotes(params?: {
    categoryId?: string;
    folderId?: string;
    isPinned?: boolean;
    searchTerm?: string;
  }): Observable<Note[]> {
    const currentUser = this.authService.currentUser();
    const queryParams: any = { ...params };
    if (currentUser) {
      queryParams.userEmail = currentUser.email;
    }
    return this.apiService.get<Note[]>(this.NOTES_PATH, queryParams);
  }

  getNote(id: string): Observable<Note> {
    return this.apiService.get<Note>(`${this.NOTES_PATH}/${id}`);
  }

  createNote(note: Partial<Note>): Observable<Note> {
    return this.apiService.post<Note>(this.NOTES_PATH, note);
  }

  updateNote(id: string, note: Partial<Note>): Observable<Note> {
    return this.apiService.put<Note>(`${this.NOTES_PATH}/${id}`, note);
  }

  deleteNote(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.NOTES_PATH}/${id}`);
  }

  togglePin(id: string, isPinned: boolean): Observable<Note> {
    return this.apiService.patch<Note>(`${this.NOTES_PATH}/${id}/pin`, { isPinned });
  }

  // Categories CRUD
  getCategories(): Observable<NoteCategory[]> {
    const currentUser = this.authService.currentUser();
    return this.apiService.get<NoteCategory[]>(this.CATEGORIES_PATH, {
      userEmail: currentUser?.email
    });
  }

  createCategory(category: Partial<NoteCategory>): Observable<NoteCategory> {
    return this.apiService.post<NoteCategory>(this.CATEGORIES_PATH, category);
  }

  updateCategory(id: string, category: Partial<NoteCategory>): Observable<NoteCategory> {
    return this.apiService.put<NoteCategory>(`${this.CATEGORIES_PATH}/${id}`, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.CATEGORIES_PATH}/${id}`);
  }

  // Folders CRUD
  getFolders(categoryId?: string): Observable<NoteFolder[]> {
    const currentUser = this.authService.currentUser();
    return this.apiService.get<NoteFolder[]>(this.FOLDERS_PATH, {
      userEmail: currentUser?.email,
      categoryId
    });
  }

  createFolder(folder: Partial<NoteFolder>): Observable<NoteFolder> {
    return this.apiService.post<NoteFolder>(this.FOLDERS_PATH, folder);
  }

  updateFolder(id: string, folder: Partial<NoteFolder>): Observable<NoteFolder> {
    return this.apiService.put<NoteFolder>(`${this.FOLDERS_PATH}/${id}`, folder);
  }

  deleteFolder(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.FOLDERS_PATH}/${id}`);
  }
}
