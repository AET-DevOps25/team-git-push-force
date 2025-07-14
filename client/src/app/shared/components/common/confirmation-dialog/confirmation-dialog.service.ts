import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  constructor(private dialog: MatDialog) {}

  openConfirmDialog(data: ConfirmationDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      data,
      panelClass: 'confirmation-dialog-panel'
    });

    return dialogRef.afterClosed();
  }

  openDeleteConfirmation(itemName: string): Observable<boolean> {
    return this.openConfirmDialog({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete <strong>${itemName}</strong>? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete'
    });
  }

  openUnsavedChangesDialog(): Observable<boolean> {
    return this.openConfirmDialog({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave without saving?',
      confirmText: 'Leave',
      cancelText: 'Stay',
      type: 'warning',
      icon: 'warning'
    });
  }

  openLogoutConfirmation(): Observable<boolean> {
    return this.openConfirmDialog({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your account?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      type: 'info',
      icon: 'logout'
    });
  }

  openClearDataConfirmation(dataType: string): Observable<boolean> {
    return this.openConfirmDialog({
      title: `Clear ${dataType}`,
      message: `This will permanently remove all ${dataType.toLowerCase()}. This action cannot be undone.`,
      confirmText: 'Clear',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'clear_all'
    });
  }
} 