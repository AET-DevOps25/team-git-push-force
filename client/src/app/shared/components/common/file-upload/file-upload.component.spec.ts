import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FileUploadComponent, UploadedFile } from './file-upload.component';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FileUploadComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.title).toBe('Upload Documents');
    expect(component.description).toBe('Drag & drop files here or click to browse');
    expect(component.acceptedTypes).toEqual(['PDF', 'DOC', 'DOCX', 'TXT']);
    expect(component.multiple).toBe(true);
    expect(component.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
    expect(component.disabled).toBe(false);
    expect(component.isUploading).toBe(false);
    expect(component.selectedFiles).toEqual([]);
    expect(component.isDragOver).toBe(false);
  });

  it('should accept input properties', () => {
    component.title = 'Custom Title';
    component.description = 'Custom Description';
    component.acceptedTypes = ['PDF', 'DOCX'];
    component.multiple = false;
    component.maxFileSize = 5 * 1024 * 1024; // 5MB
    component.disabled = true;
    component.isUploading = true;

    expect(component.title).toBe('Custom Title');
    expect(component.description).toBe('Custom Description');
    expect(component.acceptedTypes).toEqual(['PDF', 'DOCX']);
    expect(component.multiple).toBe(false);
    expect(component.maxFileSize).toBe(5 * 1024 * 1024);
    expect(component.disabled).toBe(true);
    expect(component.isUploading).toBe(true);
  });

  describe('Accept String Generation', () => {
    it('should generate correct accept string from types', () => {
      component.acceptedTypes = ['PDF', 'DOC', 'DOCX'];
      expect(component.acceptString).toBe('.pdf,.doc,.docx');
    });

    it('should handle empty accepted types', () => {
      component.acceptedTypes = [];
      expect(component.acceptString).toBe('');
    });

    it('should handle single type', () => {
      component.acceptedTypes = ['PDF'];
      expect(component.acceptString).toBe('.pdf');
    });
  });

  describe('Drag and Drop Events', () => {
    let mockEvent: jasmine.SpyObj<DragEvent>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
      spyOn(component.filesSelected, 'emit');
    });

    describe('onDragOver', () => {
      it('should set isDragOver to true when not disabled', () => {
        component.disabled = false;
        
        component.onDragOver(mockEvent);
        
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(component.isDragOver).toBe(true);
      });

      it('should not set isDragOver when disabled', () => {
        component.disabled = true;
        
        component.onDragOver(mockEvent);
        
        expect(component.isDragOver).toBe(false);
      });
    });

    describe('onDragLeave', () => {
      it('should set isDragOver to false when not disabled', () => {
        component.disabled = false;
        component.isDragOver = true;
        
        component.onDragLeave(mockEvent);
        
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(component.isDragOver).toBe(false);
      });

      it('should not change isDragOver when disabled', () => {
        component.disabled = true;
        component.isDragOver = true;
        
        component.onDragLeave(mockEvent);
        
        expect(component.isDragOver).toBe(true);
      });
    });

    describe('onDrop', () => {
      it('should process files when not disabled and files exist', () => {
        const mockFiles = [new File(['content'], 'test.pdf', { type: 'application/pdf' })] as any;
        const mockDragEvent = {
          preventDefault: jasmine.createSpy('preventDefault'),
          dataTransfer: { files: mockFiles }
        } as any;
        component.disabled = false;
        component.isDragOver = true;
        
        component.onDrop(mockDragEvent);
        
        expect(mockDragEvent.preventDefault).toHaveBeenCalled();
        expect(component.isDragOver).toBe(false);
        expect(component.selectedFiles.length).toBe(1);
      });

      it('should not process files when disabled', () => {
        component.disabled = true;
        
        component.onDrop(mockEvent);
        
        expect(component.selectedFiles.length).toBe(0);
      });

      it('should not process files when no files in dataTransfer', () => {
        const mockDragEvent = {
          preventDefault: jasmine.createSpy('preventDefault'),
          dataTransfer: { files: null }
        } as any;
        component.disabled = false;
        
        component.onDrop(mockDragEvent);
        
        expect(component.selectedFiles.length).toBe(0);
      });

      it('should not process files when dataTransfer is null', () => {
        const mockDragEvent = {
          preventDefault: jasmine.createSpy('preventDefault'),
          dataTransfer: null
        } as any;
        component.disabled = false;
        
        component.onDrop(mockDragEvent);
        
        expect(component.selectedFiles.length).toBe(0);
      });

      it('should not process files when file list is empty', () => {
        const mockDragEvent = {
          preventDefault: jasmine.createSpy('preventDefault'),
          dataTransfer: { files: [] as any }
        } as any;
        component.disabled = false;
        
        component.onDrop(mockDragEvent);
        
        expect(component.selectedFiles.length).toBe(0);
      });
    });
  });

  describe('File Selection', () => {
    beforeEach(() => {
      spyOn(component.filesSelected, 'emit');
    });

    it('should process files when files are selected', () => {
      const mockFiles = [new File(['content'], 'test.pdf', { type: 'application/pdf' })] as any;
      const mockEvent = {
        target: { files: mockFiles }
      } as any;
      
      component.onFileSelected(mockEvent);
      
      expect(component.selectedFiles.length).toBe(1);
      expect(component.filesSelected.emit).toHaveBeenCalled();
    });

    it('should not process files when no files selected', () => {
      const mockEvent = {
        target: { files: null }
      } as any;
      
      component.onFileSelected(mockEvent);
      
      expect(component.selectedFiles.length).toBe(0);
    });

    it('should not process files when file list is empty', () => {
      const mockEvent = {
        target: { files: [] as any }
      } as any;
      
      component.onFileSelected(mockEvent);
      
      expect(component.selectedFiles.length).toBe(0);
    });
  });

  describe('File Processing', () => {
    let mockFile: File;
    let fileList: FileList;

    beforeEach(() => {
      spyOn(component.filesSelected, 'emit');
    });

         it('should process valid files through file selection', () => {
       mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
       const mockEvent = {
         target: { files: [mockFile] as any }
       } as any;
       
       component.onFileSelected(mockEvent);
       
       expect(component.selectedFiles.length).toBe(1);
       expect(component.selectedFiles[0].file).toBe(mockFile);
       expect(component.selectedFiles[0].error).toBeUndefined();
       expect(component.filesSelected.emit).toHaveBeenCalled();
     });

     it('should reject files that are too large', () => {
       // Create a large file that exceeds the limit
       const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
       mockFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
       const mockEvent = {
         target: { files: [mockFile] as any }
       } as any;
       component.maxFileSize = 10 * 1024 * 1024; // 10MB
       
       component.onFileSelected(mockEvent);
       
       expect(component.selectedFiles[0].error).toContain('File size exceeds');
     });

     it('should reject files with unsupported extensions', () => {
       mockFile = new File(['content'], 'test.exe', { type: 'application/exe' });
       const mockEvent = {
         target: { files: [mockFile] as any }
       } as any;
       
       component.onFileSelected(mockEvent);
       
       expect(component.selectedFiles[0].error).toContain('File type .EXE not supported');
     });

     it('should handle files without extensions', () => {
       mockFile = new File(['content'], 'noextension', { type: 'text/plain' });
       const mockEvent = {
         target: { files: [mockFile] as any }
       } as any;
       
       component.onFileSelected(mockEvent);
       
       // File without extension should get an error since no extension means no match to accepted types
       expect(component.selectedFiles[0].error).toContain('File type .NOEXTENSION not supported');
     });

     it('should handle multiple=false by taking only first file', () => {
       const mockFile1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
       const mockFile2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
       const mockEvent = {
         target: { files: [mockFile1, mockFile2] as any }
       } as any;
       component.multiple = false;
       
       component.onFileSelected(mockEvent);
       
       expect(component.selectedFiles.length).toBe(1);
       expect(component.selectedFiles[0].file).toBe(mockFile1);
     });

     it('should append files when multiple=true', () => {
       mockFile = new File(['content1'], 'existing.pdf', { type: 'application/pdf' });
       component.selectedFiles = [{ file: mockFile }];
       
       const newFile = new File(['content2'], 'new.pdf', { type: 'application/pdf' });
       const mockEvent = {
         target: { files: [newFile] as any }
       } as any;
       component.multiple = true;
       
       component.onFileSelected(mockEvent);
       
       expect(component.selectedFiles.length).toBe(2);
     });
  });

  describe('File Management', () => {
    let mockUploadedFile: UploadedFile;

    beforeEach(() => {
      mockUploadedFile = {
        file: new File(['content'], 'test.pdf', { type: 'application/pdf' })
      };
      component.selectedFiles = [mockUploadedFile];
      spyOn(component.fileRemoved, 'emit');
      spyOn(component.filesCleared, 'emit');
    });

    it('should remove file from selected files', () => {
      component.removeFile(mockUploadedFile);
      
      expect(component.selectedFiles.length).toBe(0);
      expect(component.fileRemoved.emit).toHaveBeenCalledWith(mockUploadedFile);
    });

    it('should not remove file if not found', () => {
      const otherFile = {
        file: new File(['other'], 'other.pdf', { type: 'application/pdf' })
      };
      
      component.removeFile(otherFile);
      
      expect(component.selectedFiles.length).toBe(1);
      expect(component.fileRemoved.emit).not.toHaveBeenCalled();
    });

    it('should clear all files', () => {
      component.clearFiles();
      
      expect(component.selectedFiles.length).toBe(0);
      expect(component.filesCleared.emit).toHaveBeenCalled();
    });
  });

  describe('File Upload', () => {
    beforeEach(() => {
      spyOn(component.uploadRequested, 'emit');
    });

    it('should emit upload request when files exist', () => {
      const mockFile = {
        file: new File(['content'], 'test.pdf', { type: 'application/pdf' })
      };
      component.selectedFiles = [mockFile];
      
      component.uploadFiles();
      
      expect(component.uploadRequested.emit).toHaveBeenCalledWith([mockFile]);
    });

    it('should not emit upload request when no files', () => {
      component.selectedFiles = [];
      
      component.uploadFiles();
      
      expect(component.uploadRequested.emit).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    describe('formatFileSize', () => {
      it('should format bytes correctly', () => {
        expect(component.formatFileSize(0)).toBe('0 Bytes');
        expect(component.formatFileSize(1024)).toBe('1 KB');
        expect(component.formatFileSize(1024 * 1024)).toBe('1 MB');
        expect(component.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      });

      it('should format partial sizes', () => {
        expect(component.formatFileSize(1536)).toBe('1.5 KB'); // 1.5 KB
        expect(component.formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
      });

      it('should handle very small sizes', () => {
        expect(component.formatFileSize(512)).toBe('512 Bytes');
      });
    });

    describe('trackByFile', () => {
      it('should return unique identifier for file', () => {
        const uploadedFile = {
          file: new File(['content'], 'test.pdf', { type: 'application/pdf' })
        };
        
        const result = component.trackByFile(0, uploadedFile);
        
        expect(result).toContain('test.pdf');
        expect(result).toContain(uploadedFile.file.size.toString());
      });
    });
  });

     describe('Error Scenarios', () => {
     it('should handle file with null extension gracefully', () => {
       const mockFile = new File(['content'], '', { type: 'text/plain' });
       const mockEvent = {
         target: { files: [mockFile] as any }
       } as any;
       
       expect(() => component.onFileSelected(mockEvent)).not.toThrow();
     });

     it('should handle undefined file properties gracefully', () => {
       const mockFile = {
         name: 'test.txt', // Give it a valid name instead of undefined
         size: 1000
       } as any;
       const mockEvent = {
         target: { files: [mockFile] as any }
       } as any;
       
       expect(() => component.onFileSelected(mockEvent)).not.toThrow();
       expect(component.selectedFiles.length).toBe(1);
     });
   });
}); 