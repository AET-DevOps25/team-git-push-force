import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentService } from '../../../../core/services/document.service';
import { ProcessedDocument } from '../../../../core/models/document.model';

export interface DocumentsDialogData {
  conceptId: string;
  conceptTitle: string;
}

@Component({
  selector: 'app-documents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './documents-dialog.component.html',
  styleUrl: './documents-dialog.component.scss'
})
export class DocumentsDialogComponent implements OnInit, OnDestroy {
  documents: ProcessedDocument[] = [];
  isLoading = true;
  isUploading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<DocumentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentsDialogData,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.documentService.getConceptDocuments(this.data.conceptId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.documents = response.documents;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading documents:', error);
          this.isLoading = false;
        }
      });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (files && files.length > 0) {
      this.uploadFiles(Array.from(files));
    }
  }

  uploadFiles(files: File[]): void {
    // Validate files before upload
    const validFiles = files.filter(file => file.size > 0);
    
    if (validFiles.length === 0) {
      console.error('No valid files to upload');
      return;
    }
    
    this.isUploading = true;
    
    this.documentService.uploadDocuments(validFiles, this.data.conceptId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.documents = [...this.documents, ...response.processedDocuments];
          this.isUploading = false;
          this.resetFileInput();
        },
        error: (error) => {
          console.error('Error uploading documents:', error);
          this.isUploading = false;
          this.resetFileInput();
        }
      });
  }

  deleteDocument(document: ProcessedDocument): void {
    this.documentService.deleteDocument(document.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== document.id);
        },
        error: (error) => {
          console.error('Error deleting document:', error);
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'check_circle';
      case 'PROCESSING': return 'pending';
      case 'FAILED': return 'error';
      case 'QUEUED': return 'schedule';
      default: return 'description';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'primary';
      case 'PROCESSING': return 'accent';
      case 'FAILED': return 'warn';
      default: return '';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'INDUSTRY_REPORT': return 'assessment';
      case 'BRAND_DECK': return 'palette';
      case 'PAST_EVENT_DEBRIEF': return 'event_note';
      case 'GUIDELINES': return 'rule';
      default: return 'description';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByDocumentId(index: number, document: ProcessedDocument): string {
    return document.id;
  }

  private resetFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
} 