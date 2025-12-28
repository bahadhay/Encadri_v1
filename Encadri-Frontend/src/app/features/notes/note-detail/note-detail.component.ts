import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NoteService } from '../../../core/services/note.service';
import { ToastService } from '../../../core/services/toast.service';
import { Note } from '../../../core/models/note.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { SkeletonProfileComponent } from '../../../shared/components/skeleton-profile/skeleton-profile.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-note-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UiCardComponent,
    UiButtonComponent,
    SkeletonProfileComponent,
    ConfirmDialogComponent,
    IconComponent
  ],
  templateUrl: './note-detail.component.html',
  styleUrls: ['./note-detail.component.css']
})
export class NoteDetailComponent implements OnInit {
  private noteService = inject(NoteService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  note = signal<Note | null>(null);
  loading = signal<boolean>(true);
  isDeleteDialogOpen = signal<boolean>(false);
  deleting = signal<boolean>(false);

  deleteMessage = computed(() => {
    const noteTitle = this.note()?.title || 'this note';
    return `Are you sure you want to delete "${noteTitle}"? This action cannot be undone.`;
  });

  ngOnInit() {
    const noteId = this.route.snapshot.paramMap.get('id');
    if (noteId) {
      this.loadNote(noteId);
    }
  }

  loadNote(id: string) {
    this.loading.set(true);
    this.noteService.getNote(id).subscribe({
      next: (data) => {
        this.note.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load note', err);
        this.toastService.error('Failed to load note');
        this.router.navigate(['/notes']);
      }
    });
  }

  togglePin() {
    const currentNote = this.note();
    if (!currentNote || !currentNote.id) return;

    const newPinState = !currentNote.isPinned;
    this.noteService.togglePin(currentNote.id, newPinState).subscribe({
      next: () => {
        this.note.set({ ...currentNote, isPinned: newPinState });
        this.toastService.success(newPinState ? 'Note pinned' : 'Note unpinned');
      },
      error: (err) => {
        console.error('Failed to toggle pin', err);
        this.toastService.error('Failed to update note');
      }
    });
  }

  confirmDelete() {
    const currentNote = this.note();
    if (!currentNote || !currentNote.id) return;

    this.deleting.set(true);
    this.noteService.deleteNote(currentNote.id).subscribe({
      next: () => {
        this.toastService.success('Note deleted');
        this.router.navigate(['/notes']);
      },
      error: (err) => {
        console.error('Failed to delete note', err);
        this.toastService.error('Failed to delete note');
        this.deleting.set(false);
      }
    });
  }

  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Simple markdown rendering
  renderMarkdown(text: string): string {
    if (!text) return '';

    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
      .replace(/\n/gim, '<br>');
  }
}
