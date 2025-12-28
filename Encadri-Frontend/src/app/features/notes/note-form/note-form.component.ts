import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoteService } from '../../../core/services/note.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Note } from '../../../core/models/note.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    UiCardComponent,
    UiButtonComponent,
    UiInputComponent
  ],
  templateUrl: './note-form.component.html',
  styleUrls: ['./note-form.component.css']
})
export class NoteFormComponent implements OnInit {
  private noteService = inject(NoteService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  note: Partial<Note> = this.getEmptyNote();
  loading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  showPreview = signal<boolean>(false);

  colors = [
    { value: '', label: 'Default', class: '' },
    { value: 'red', label: 'Red', class: 'bg-red-50 border-red-200' },
    { value: 'blue', label: 'Blue', class: 'bg-blue-50 border-blue-200' },
    { value: 'green', label: 'Green', class: 'bg-green-50 border-green-200' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-50 border-yellow-200' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-50 border-purple-200' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-50 border-orange-200' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-50 border-pink-200' },
  ];

  ngOnInit() {
    const noteId = this.route.snapshot.paramMap.get('id');
    if (noteId) {
      this.isEditMode.set(true);
      this.loadNote(noteId);
    }
  }

  getEmptyNote(): Partial<Note> {
    const currentUser = this.authService.currentUser();
    return {
      title: '',
      content: '',
      color: '',
      isPinned: false,
      userEmail: currentUser?.email || ''
    };
  }

  loadNote(id: string) {
    this.loading.set(true);
    this.noteService.getNote(id).subscribe({
      next: (data) => {
        this.note = data;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load note', err);
        this.toastService.error('Failed to load note');
        this.router.navigate(['/notes']);
      }
    });
  }

  onSubmit() {
    if (!this.note.title || !this.note.content) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    if (this.isEditMode() && this.note.id) {
      this.noteService.updateNote(this.note.id, this.note).subscribe({
        next: () => {
          this.toastService.success('Note updated successfully');
          this.router.navigate(['/notes', this.note.id]);
        },
        error: (err) => {
          console.error('Failed to update note', err);
          this.toastService.error('Failed to update note');
          this.loading.set(false);
        }
      });
    } else {
      this.noteService.createNote(this.note).subscribe({
        next: (createdNote) => {
          this.toastService.success('Note created successfully');
          this.router.navigate(['/notes', createdNote.id]);
        },
        error: (err) => {
          console.error('Failed to create note', err);
          this.toastService.error('Failed to create note');
          this.loading.set(false);
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/notes']);
  }

  // Simple markdown rendering for preview
  renderMarkdown(text: string): string {
    if (!text) return '';

    // Basic markdown to HTML conversion
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
      // Line breaks
      .replace(/\n/gim, '<br>');
  }
}
