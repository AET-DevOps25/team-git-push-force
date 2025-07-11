import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

export interface UploadedFile {
  file: File;
  progress?: number;
  error?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  @Input() title: string = 'Upload Documents';
  @Input() description: string = 'Drag & drop files here or click to browse';
  @Input() acceptedTypes: string[] = ['PDF', 'DOC', 'DOCX', 'TXT'];
  @Input() multiple: boolean = true;
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB
  @Input() disabled: boolean = false;
  @Input() isUploading: boolean = false;
  
  @Output() filesSelected = new EventEmitter<UploadedFile[]>();
  @Output() uploadRequested = new EventEmitter<UploadedFile[]>();
  @Output() fileRemoved = new EventEmitter<UploadedFile>();
  @Output() filesCleared = new EventEmitter<void>();
  
  selectedFiles: UploadedFile[] = [];
  isDragOver = false;

  get acceptString(): string {
    const extensions = this.acceptedTypes.map(type => `.${type.toLowerCase()}`);
    return extensions.join(',');
  }

  onDragOver(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(files);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.processFiles(target.files);
    }
  }

  private processFiles(fileList: FileList): void {
    const files = Array.from(fileList);
    const newFiles: UploadedFile[] = [];

    files.forEach(file => {
      const uploadFile: UploadedFile = { file };
      
      // Validate file size
      if (file.size > this.maxFileSize) {
        uploadFile.error = `File size exceeds ${this.formatFileSize(this.maxFileSize)} limit`;
      }
      
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toUpperCase();
      if (fileExtension && !this.acceptedTypes.includes(fileExtension)) {
        uploadFile.error = `File type .${fileExtension} not supported`;
      }
      
      newFiles.push(uploadFile);
    });

    if (!this.multiple) {
      this.selectedFiles = newFiles.slice(0, 1);
    } else {
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
    }

    this.filesSelected.emit(this.selectedFiles);
  }

  removeFile(uploadFile: UploadedFile): void {
    const index = this.selectedFiles.indexOf(uploadFile);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
      this.fileRemoved.emit(uploadFile);
    }
  }

  clearFiles(): void {
    this.selectedFiles = [];
    this.filesCleared.emit();
  }

  uploadFiles(): void {
    if (this.selectedFiles.length > 0) {
      this.uploadRequested.emit(this.selectedFiles);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  trackByFile(index: number, uploadFile: UploadedFile): string {
    return uploadFile.file.name + uploadFile.file.size;
  }
} 