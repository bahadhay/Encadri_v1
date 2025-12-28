import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoteService } from '../../../core/services/note.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Note } from '../../../core/models/note.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton-card/skeleton-card.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    UiCardComponent,
    UiButtonComponent,
    UiInputComponent,
    SkeletonCardComponent,
    ConfirmDialogComponent,
    IconComponent
  ],
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.css']
})
export class NoteListComponent {
  private noteService = inject(NoteService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  notes = signal<Note[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');

  // Delete dialog state
  isDeleteDialogOpen = signal<boolean>(false);
  noteToDelete = signal<Note | null>(null);
  deleting = signal<boolean>(false);

  constructor() {
    this.loadNotes();
  }

  loadNotes() {
    this.loading.set(true);
    this.noteService.getNotes().subscribe({
      next: (data) => {
        this.notes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load notes', err);
        this.toastService.error('Failed to load notes');
        this.loading.set(false);
      }
    });
  }

  filteredNotes = computed(() => {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.notes();

    return this.notes().filter(note =>
      note.title.toLowerCase().includes(search) ||
      note.content.toLowerCase().includes(search)
    );
  });

  pinnedNotes = computed(() => this.filteredNotes().filter(n => n.isPinned));
  unpinnedNotes = computed(() => this.filteredNotes().filter(n => !n.isPinned));

  togglePin(note: Note, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const newPinState = !note.isPinned;
    this.noteService.togglePin(note.id!, newPinState).subscribe({
      next: () => {
        note.isPinned = newPinState;
        this.notes.set([...this.notes()]);
        this.toastService.success(newPinState ? 'Note pinned' : 'Note unpinned');
      },
      error: (err) => {
        console.error('Failed to toggle pin', err);
        this.toastService.error('Failed to update note');
      }
    });
  }

  openDeleteDialog(note: Note, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    this.noteToDelete.set(note);
    this.isDeleteDialogOpen.set(true);
  }

  confirmDelete() {
    const note = this.noteToDelete();
    if (!note || !note.id) return;

    this.deleting.set(true);
    this.noteService.deleteNote(note.id).subscribe({
      next: () => {
        this.notes.set(this.notes().filter(n => n.id !== note.id));
        this.toastService.success('Note deleted');
        this.isDeleteDialogOpen.set(false);
        this.deleting.set(false);
      },
      error: (err) => {
        console.error('Failed to delete note', err);
        this.toastService.error('Failed to delete note');
        this.deleting.set(false);
      }
    });
  }

  getColorClass(color?: string): string {
    const colorMap: { [key: string]: string } = {
      'red': 'bg-red-50 border-red-200',
      'blue': 'bg-blue-50 border-blue-200',
      'green': 'bg-green-50 border-green-200',
      'yellow': 'bg-yellow-50 border-yellow-200',
      'purple': 'bg-purple-50 border-purple-200',
      'orange': 'bg-orange-50 border-orange-200',
      'pink': 'bg-pink-50 border-pink-200',
    };
    return color ? colorMap[color] || '' : '';
  }

  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
