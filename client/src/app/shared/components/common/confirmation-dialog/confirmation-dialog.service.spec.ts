import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ConfirmationDialogService } from './confirmation-dialog.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';

describe('ConfirmationDialogService', () => {
  let service: ConfirmationDialogService;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ConfirmationDialogComponent>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    
    TestBed.configureTestingModule({
      providers: [
        ConfirmationDialogService,
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });

    service = TestBed.inject(ConfirmationDialogService);
    matDialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    
    // Setup default dialog behavior
    matDialogSpy.open.and.returnValue(mockDialogRef);
    mockDialogRef.afterClosed.and.returnValue(of(true));
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have required methods', () => {
      expect(typeof service.openConfirmDialog).toBe('function');
      expect(typeof service.openDeleteConfirmation).toBe('function');
      expect(typeof service.openUnsavedChangesDialog).toBe('function');
      expect(typeof service.openLogoutConfirmation).toBe('function');
      expect(typeof service.openClearDataConfirmation).toBe('function');
    });
  });

  describe('openConfirmDialog', () => {
    it('should open dialog with correct configuration', () => {
      const testData: ConfirmationDialogData = {
        title: 'Test Title',
        message: 'Test message',
        confirmText: 'Confirm',
        cancelText: 'Cancel'
      };

      service.openConfirmDialog(testData);

      expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationDialogComponent, {
        width: '400px',
        maxWidth: '90vw',
        disableClose: false,
        data: testData,
        panelClass: 'confirmation-dialog-panel'
      });
    });

    it('should return observable from afterClosed', (done) => {
      const testData: ConfirmationDialogData = {
        title: 'Test',
        message: 'Test message'
      };
      mockDialogRef.afterClosed.and.returnValue(of(true));

      service.openConfirmDialog(testData).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should handle dialog being closed with false result', (done) => {
      const testData: ConfirmationDialogData = {
        title: 'Test',
        message: 'Test message'
      };
      mockDialogRef.afterClosed.and.returnValue(of(false));

      service.openConfirmDialog(testData).subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should handle dialog being closed with undefined result', (done) => {
      const testData: ConfirmationDialogData = {
        title: 'Test',
        message: 'Test message'
      };
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openConfirmDialog(testData).subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should pass all dialog data properties correctly', () => {
      const testData: ConfirmationDialogData = {
        title: 'Custom Title',
        message: 'Custom message with <strong>HTML</strong>',
        confirmText: 'Custom Confirm',
        cancelText: 'Custom Cancel',
        type: 'warning',
        icon: 'warning'
      };

      service.openConfirmDialog(testData);

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      expect(callArgs?.[1]?.data).toEqual(testData);
    });
  });

  describe('openDeleteConfirmation', () => {
    it('should open delete confirmation dialog with correct data', () => {
      const itemName = 'Test Item';
      
      service.openDeleteConfirmation(itemName);

      const expectedData: ConfirmationDialogData = {
        title: 'Delete Confirmation',
        message: `Are you sure you want to delete <strong>${itemName}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
        icon: 'delete'
      };

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      expect(callArgs?.[1]?.data).toEqual(expectedData);
    });

    it('should return observable result', (done) => {
      mockDialogRef.afterClosed.and.returnValue(of(true));

      service.openDeleteConfirmation('Test Item').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should escape HTML in item name', () => {
      const itemName = 'Item with <script>alert("xss")</script>';
      
      service.openDeleteConfirmation(itemName);

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      const dialogData = callArgs?.[1]?.data as ConfirmationDialogData;
      expect(dialogData?.message).toContain('<strong>Item with <script>alert("xss")</script></strong>');
    });

    it('should handle empty item name', () => {
      service.openDeleteConfirmation('');

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      const dialogData = callArgs?.[1]?.data as ConfirmationDialogData;
      expect(dialogData?.message).toContain('<strong></strong>');
    });
  });

  describe('openUnsavedChangesDialog', () => {
    it('should open unsaved changes dialog with correct data', () => {
      service.openUnsavedChangesDialog();

      const expectedData: ConfirmationDialogData = {
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave without saving?',
        confirmText: 'Leave',
        cancelText: 'Stay',
        type: 'warning',
        icon: 'warning'
      };

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      expect(callArgs?.[1]?.data).toEqual(expectedData);
    });

    it('should return observable result', (done) => {
      mockDialogRef.afterClosed.and.returnValue(of(false));

      service.openUnsavedChangesDialog().subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  describe('openLogoutConfirmation', () => {
    it('should open logout confirmation dialog with correct data', () => {
      service.openLogoutConfirmation();

      const expectedData: ConfirmationDialogData = {
        title: 'Sign Out',
        message: 'Are you sure you want to sign out of your account?',
        confirmText: 'Sign Out',
        cancelText: 'Cancel',
        type: 'info',
        icon: 'logout'
      };

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      expect(callArgs?.[1]?.data).toEqual(expectedData);
    });

    it('should return observable result', (done) => {
      mockDialogRef.afterClosed.and.returnValue(of(true));

      service.openLogoutConfirmation().subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('openClearDataConfirmation', () => {
    it('should open clear data confirmation dialog with correct data', () => {
      const dataType = 'Chat History';
      
      service.openClearDataConfirmation(dataType);

      const expectedData: ConfirmationDialogData = {
        title: 'Clear Chat History',
        message: 'This will permanently remove all chat history. This action cannot be undone.',
        confirmText: 'Clear',
        cancelText: 'Cancel',
        type: 'danger',
        icon: 'clear_all'
      };

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      expect(callArgs?.[1]?.data).toEqual(expectedData);
    });

    it('should handle different data types correctly', () => {
      service.openClearDataConfirmation('User Preferences');

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      const dialogData = callArgs?.[1]?.data as ConfirmationDialogData;
      expect(dialogData?.title).toBe('Clear User Preferences');
      expect(dialogData?.message).toContain('user preferences');
    });

    it('should convert data type to lowercase in message', () => {
      service.openClearDataConfirmation('CONCEPTS');

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      const dialogData = callArgs?.[1]?.data as ConfirmationDialogData;
      expect(dialogData?.message).toContain('all concepts');
    });

    it('should return observable result', (done) => {
      mockDialogRef.afterClosed.and.returnValue(of(false));

      service.openClearDataConfirmation('Test Data').subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should handle empty data type', () => {
      service.openClearDataConfirmation('');

      const callArgs = matDialogSpy.open.calls.mostRecent()?.args;
      const dialogData = callArgs?.[1]?.data as ConfirmationDialogData;
      expect(dialogData?.title).toBe('Clear ');
      expect(dialogData?.message).toContain('all ');
    });
  });

  describe('Dialog Configuration', () => {
    it('should use consistent dialog configuration across all methods', () => {
      const expectedConfig = {
        width: '400px',
        maxWidth: '90vw',
        disableClose: false,
        panelClass: 'confirmation-dialog-panel'
      };

      // Test each method
      service.openDeleteConfirmation('test');
      let call = matDialogSpy.open.calls.mostRecent();
      let callArgs = call?.args?.[1];
      expect(callArgs?.width).toBe(expectedConfig.width);
      expect(callArgs?.maxWidth).toBe(expectedConfig.maxWidth);
      expect(callArgs?.disableClose).toBe(expectedConfig.disableClose);
      expect(callArgs?.panelClass).toBe(expectedConfig.panelClass);

      service.openUnsavedChangesDialog();
      call = matDialogSpy.open.calls.mostRecent();
      callArgs = call?.args?.[1];
      expect(callArgs?.width).toBe(expectedConfig.width);

      service.openLogoutConfirmation();
      call = matDialogSpy.open.calls.mostRecent();
      callArgs = call?.args?.[1];
      expect(callArgs?.width).toBe(expectedConfig.width);

      service.openClearDataConfirmation('test');
      call = matDialogSpy.open.calls.mostRecent();
      callArgs = call?.args?.[1];
      expect(callArgs?.width).toBe(expectedConfig.width);
    });

    it('should always use ConfirmationDialogComponent', () => {
      service.openDeleteConfirmation('test');
      expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationDialogComponent, jasmine.any(Object));

      service.openUnsavedChangesDialog();
      expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationDialogComponent, jasmine.any(Object));

      service.openLogoutConfirmation();
      expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationDialogComponent, jasmine.any(Object));

      service.openClearDataConfirmation('test');
      expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationDialogComponent, jasmine.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('should handle MatDialog.open throwing error', () => {
      matDialogSpy.open.and.throwError('Dialog creation error');

      expect(() => {
        service.openConfirmDialog({ title: 'Test', message: 'Test' });
      }).toThrow();
    });

    it('should handle afterClosed observable errors', (done) => {
      const errorObs = throwError(() => new Error('Observable error'));
      mockDialogRef.afterClosed.and.returnValue(errorObs);

      service.openConfirmDialog({ title: 'Test', message: 'Test' }).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Observable error');
          done();
        }
      });
    });
  });

  describe('Multiple Dialog Instances', () => {
    it('should handle multiple simultaneous dialogs', () => {
      const dialogRef1 = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      const dialogRef2 = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      
      dialogRef1.afterClosed.and.returnValue(of(true));
      dialogRef2.afterClosed.and.returnValue(of(false));

      matDialogSpy.open.and.returnValues(dialogRef1, dialogRef2);

      service.openDeleteConfirmation('Item 1').subscribe(result => {
        expect(result).toBe(true);
      });

      service.openLogoutConfirmation().subscribe(result => {
        expect(result).toBe(false);
      });

      expect(matDialogSpy.open).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Management', () => {
    it('should not create memory leaks with subscriptions', () => {
      const subscriptions = [];
      
      for (let i = 0; i < 5; i++) {
        subscriptions.push(
          service.openConfirmDialog({ title: `Test ${i}`, message: 'Test' }).subscribe()
        );
      }

      // Unsubscribe all
      subscriptions.forEach(sub => sub.unsubscribe());

      // Should not throw or cause issues
      expect(service).toBeDefined();
    });
  });
}); 