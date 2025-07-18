import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    // Create a spy object for localStorage
    localStorageSpy = jasmine.createSpyObj('localStorage', ['setItem', 'getItem', 'removeItem', 'clear']);
    
    // Replace the global localStorage with our spy
    Object.defineProperty(window, 'localStorage', {
      value: localStorageSpy,
      writable: true
    });

    TestBed.configureTestingModule({
      providers: [StorageService]
    });
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    // Clean up any spies
    localStorageSpy.setItem.calls.reset();
    localStorageSpy.getItem.calls.reset();
    localStorageSpy.removeItem.calls.reset();
    localStorageSpy.clear.calls.reset();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have required methods', () => {
      expect(typeof service.setItem).toBe('function');
      expect(typeof service.getItem).toBe('function');
      expect(typeof service.removeItem).toBe('function');
      expect(typeof service.clear).toBe('function');
    });
  });

  describe('LocalStorage Availability Check', () => {
    it('should detect when localStorage is available', () => {
      // Setup localStorage to work normally
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();

      const testData = { test: 'value' };
      service.setItem('test-key', testData);

      expect(localStorageSpy.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
    });

    it('should handle when localStorage setItem throws an error', () => {
      // Mock localStorage operations - availability check passes, but actual setItem fails
      localStorageSpy.setItem.and.callFake((key: string) => {
        if (key === '__storage_test__') return; // Availability check passes
        throw new Error('QuotaExceededError'); // Actual operations fail
      });
      localStorageSpy.removeItem.and.stub();
      spyOn(console, 'error');

      const testData = { test: 'value' };
      
      // Should not throw, should handle gracefully
      expect(() => service.setItem('test-key', testData)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Error saving to localStorage:', jasmine.any(Error));
    });

    it('should handle when localStorage removeItem for availability check throws an error', () => {
      // Mock localStorage operations for the availability check
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.throwError('Access denied');

      const testData = { test: 'value' };
      
      // Should handle the availability check failure gracefully
      expect(() => service.setItem('test-key', testData)).not.toThrow();
      // Since availability check fails, setItem shouldn't be called with our actual data
      expect(localStorageSpy.setItem).toHaveBeenCalledWith('__storage_test__', '__storage_test__');
    });

    it('should handle when localStorage is completely unavailable', () => {
      // Make localStorage completely unavailable
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });

      // Create a new service instance to test without localStorage
      const newService = new StorageService();
      
      // Should not throw errors
      expect(() => newService.setItem('test', 'value')).not.toThrow();
      expect(() => newService.getItem('test')).not.toThrow();
      expect(() => newService.removeItem('test')).not.toThrow();
      expect(() => newService.clear()).not.toThrow();
    });
  });

  describe('setItem', () => {
    it('should store primitive values', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();

      service.setItem('string-key', 'test string');
      service.setItem('number-key', 42);
      service.setItem('boolean-key', true);

      expect(localStorageSpy.setItem).toHaveBeenCalledWith('string-key', '"test string"');
      expect(localStorageSpy.setItem).toHaveBeenCalledWith('number-key', '42');
      expect(localStorageSpy.setItem).toHaveBeenCalledWith('boolean-key', 'true');
    });

    it('should store complex objects', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();

      const complexObject = {
        user: {
          id: 1,
          name: 'Test User',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        },
        settings: ['setting1', 'setting2']
      };

      service.setItem('complex-key', complexObject);

      expect(localStorageSpy.setItem).toHaveBeenCalledWith('complex-key', JSON.stringify(complexObject));
    });

    it('should handle JSON stringify errors gracefully', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();
      spyOn(console, 'error');

      // Create a circular reference object that will cause JSON.stringify to fail
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      // Mock JSON.stringify to throw
      spyOn(JSON, 'stringify').and.throwError('Converting circular structure to JSON');

      expect(() => service.setItem('circular-key', circularObj)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Error saving to localStorage:', jasmine.any(Error));
    });

    it('should do nothing when localStorage is unavailable', () => {
      // Mock the availability check to return false
      localStorageSpy.setItem.and.throwError('Access denied');

      service.setItem('test-key', 'test-value');

      // Should only be called once for the availability check
      expect(localStorageSpy.setItem).toHaveBeenCalledTimes(1);
      expect(localStorageSpy.setItem).toHaveBeenCalledWith('__storage_test__', '__storage_test__');
    });
  });

  describe('getItem', () => {
    it('should retrieve and parse stored values', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();
      localStorageSpy.getItem.and.returnValue('{"name":"Test User","age":30}');

      const result = service.getItem('user-key');

      expect(localStorageSpy.getItem).toHaveBeenCalledWith('user-key');
      expect(result).toEqual({ name: 'Test User', age: 30 });
    });

    it('should return null for non-existent keys', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();
      localStorageSpy.getItem.and.returnValue(null);

      const result = service.getItem('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle JSON parse errors gracefully', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();
      localStorageSpy.getItem.and.returnValue('invalid json string');
      spyOn(console, 'error');

      const result = service.getItem('invalid-json-key');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error reading from localStorage:', jasmine.any(Error));
    });

    it('should handle localStorage getItem throwing an error', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();
      localStorageSpy.getItem.and.throwError('Access denied');
      spyOn(console, 'error');

      const result = service.getItem('test-key');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error reading from localStorage:', jasmine.any(Error));
    });

    it('should return null when localStorage is unavailable', () => {
      // Mock the availability check to return false
      localStorageSpy.setItem.and.throwError('Access denied');

      const result = service.getItem('test-key');

      expect(result).toBeNull();
      expect(localStorageSpy.getItem).not.toHaveBeenCalled();
    });

    it('should handle empty string values', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();
      localStorageSpy.getItem.and.returnValue('""');

      const result = service.getItem('empty-string-key');

      expect(result).toBe('');
    });
  });

  describe('removeItem', () => {
    it('should remove items from localStorage', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();

      service.removeItem('test-key');

      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should do nothing when localStorage is unavailable', () => {
      // Mock the availability check to return false
      localStorageSpy.setItem.and.throwError('Access denied');

      service.removeItem('test-key');

      // When localStorage is unavailable, only the availability test should be called
      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('__storage_test__');
      expect(localStorageSpy.removeItem).toHaveBeenCalledTimes(1); // Only the availability test call
      expect(localStorageSpy.removeItem).not.toHaveBeenCalledWith('test-key');
    });
  });

  describe('clear', () => {
    it('should clear all localStorage data', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();
      localStorageSpy.clear.and.stub();

      service.clear();

      expect(localStorageSpy.clear).toHaveBeenCalled();
    });

    it('should do nothing when localStorage is unavailable', () => {
      // Mock the availability check to return false
      localStorageSpy.setItem.and.throwError('Access denied');

      service.clear();

      expect(localStorageSpy.clear).not.toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle a complete storage lifecycle', () => {
      localStorageSpy.setItem.and.stub();
      localStorageSpy.removeItem.and.stub();
      localStorageSpy.getItem.and.returnValue('{"sessionId":"abc123","timestamp":1234567890}');
      localStorageSpy.clear.and.stub();

      // Store data
      const sessionData = { sessionId: 'abc123', timestamp: 1234567890 };
      service.setItem('session', sessionData);

      // Retrieve data
      const retrieved = service.getItem('session');
      expect(retrieved).toEqual(sessionData);

      // Remove specific item
      service.removeItem('session');

      // Clear all data
      service.clear();

      expect(localStorageSpy.setItem).toHaveBeenCalled();
      expect(localStorageSpy.getItem).toHaveBeenCalled();
      expect(localStorageSpy.removeItem).toHaveBeenCalled();
      expect(localStorageSpy.clear).toHaveBeenCalled();
    });

    it('should handle mixed success and failure scenarios', () => {
      spyOn(console, 'error');
      
      // Make availability check pass, but actual operations fail sporadically
      localStorageSpy.setItem.and.callFake((key: string) => {
        if (key === '__storage_test__') return; // Availability check passes
        throw new Error('Storage quota exceeded'); // Actual operations fail
      });
      localStorageSpy.removeItem.and.stub();
      
      localStorageSpy.getItem.and.throwError('Access denied');

      // These should all handle errors gracefully
      service.setItem('test1', 'value1');
      const result = service.getItem('test2');
      service.removeItem('test3');
      service.clear();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledTimes(2); // setItem and getItem errors
    });
  });
}); 