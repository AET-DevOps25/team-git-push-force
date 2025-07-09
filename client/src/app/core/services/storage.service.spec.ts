import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageService]
    });
    service = TestBed.inject(StorageService);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve items', () => {
    const testData = { id: 1, name: 'test' };
    
    service.setItem('test-key', testData);
    const retrieved = service.getItem('test-key');
    
    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent items', () => {
    const result = service.getItem('non-existent');
    expect(result).toBeNull();
  });

  it('should remove items', () => {
    service.setItem('test-key', 'test-value');
    service.removeItem('test-key');
    
    const result = service.getItem('test-key');
    expect(result).toBeNull();
  });

  it('should clear all items', () => {
    service.setItem('key1', 'value1');
    service.setItem('key2', 'value2');
    
    service.clear();
    
    expect(service.getItem('key1')).toBeNull();
    expect(service.getItem('key2')).toBeNull();
  });
}); 