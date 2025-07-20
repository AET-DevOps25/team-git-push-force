import os
import pytest
from unittest.mock import patch, MagicMock
from io import BytesIO

# Import the document service
from services.document_service import DocumentService, process_document, get_documents, delete_document_by_id

class TestDocumentService:
    """Test suite for the DocumentService class."""

    def setup_method(self):
        """Set up test environment before each test method."""
        # Ensure SKIP_MINIO and SKIP_WEAVIATE are set for testing
        os.environ["SKIP_MINIO"] = "true"
        os.environ["SKIP_WEAVIATE"] = "true"
        
        # Create a fresh instance of DocumentService for each test
        self.document_service = DocumentService()
        
        # Create a mock PDF file for testing
        self.mock_pdf_content = b"%PDF-1.7\nTest PDF content"
        self.mock_pdf_file = BytesIO(self.mock_pdf_content)
        self.mock_pdf_file.filename = "test_document.pdf"
        
        # Test concept and document IDs
        self.concept_id = "test-concept-123"
        self.document_id = "test-document-456"

    def teardown_method(self):
        """Clean up after each test method."""
        # Close the document service
        self.document_service.close()

    def test_initialization(self):
        """Test that the DocumentService class can be initialized properly."""
        assert self.document_service is not None
        assert self.document_service.s3_client is not None
        assert self.document_service.bucket_name == os.getenv('MINIO_BUCKET', 'concepts')

    @patch('services.vector_store.vector_store_service.add_texts')
    def test_process_document(self, mock_add_texts):
        """Test processing a document."""
        # Configure the mock
        mock_add_texts.return_value = ["mock-id-1", "mock-id-2"]
        
        # Process the document
        result = self.document_service.process_document(self.mock_pdf_file, self.concept_id)
        
        # Verify the result
        assert result is not None
        assert result.filename == "test_document.pdf"
        assert result.status == "COMPLETED"
        assert self.concept_id in result.s3_location
        
        # Verify that vector_store_service.add_texts was called
        mock_add_texts.assert_called_once()
        
        # Verify the document was "uploaded" to the mock S3 client
        # This is testing our mock implementation
        bucket = self.document_service.bucket_name
        assert bucket in self.document_service.s3_client.mock_objects
        
        # At least one key should exist in the bucket that contains the concept_id
        keys_with_concept = [k for k in self.document_service.s3_client.mock_objects[bucket].keys() 
                            if self.concept_id in k]
        assert len(keys_with_concept) > 0

    def test_get_documents_empty(self):
        """Test getting documents when none exist."""
        # Get documents for a concept that doesn't exist
        documents, count = self.document_service.get_documents("nonexistent-concept")
        
        # Verify the result
        assert documents == []
        assert count == 0

    @patch('services.vector_store.vector_store_service.get_document_count')
    def test_get_documents(self, mock_get_document_count):
        """Test getting documents after adding some."""
        # Configure the mock
        mock_get_document_count.return_value = 2
        
        # Add a document to the mock S3 client
        key = f"{self.concept_id}/{self.document_id}/test_document.pdf"
        if self.document_service.bucket_name not in self.document_service.s3_client.mock_objects:
            self.document_service.s3_client.mock_objects[self.document_service.bucket_name] = {}
        
        self.document_service.s3_client.mock_objects[self.document_service.bucket_name][key] = {
            'content': 'mock_content',
            'size': 100,
            'last_modified': MagicMock()
        }
        
        # Get documents
        documents, count = self.document_service.get_documents(self.concept_id)
        
        # Verify the result
        assert len(documents) == 1
        assert documents[0].id == self.document_id
        assert documents[0].filename == "test_document.pdf"
        assert count == 2  # From the mock

    @patch('services.vector_store.vector_store_service.delete_by_document_id')
    def test_delete_document(self, mock_delete_by_document_id):
        """Test deleting a document."""
        # Configure the mock
        mock_delete_by_document_id.return_value = True
        
        # Add a document to the mock S3 client
        key = f"some-concept/{self.document_id}/test_document.pdf"
        if self.document_service.bucket_name not in self.document_service.s3_client.mock_objects:
            self.document_service.s3_client.mock_objects[self.document_service.bucket_name] = {}
        
        self.document_service.s3_client.mock_objects[self.document_service.bucket_name][key] = {
            'content': 'mock_content',
            'size': 100,
            'last_modified': MagicMock()
        }
        
        # Delete the document
        result = self.document_service.delete_document_by_id(self.document_id)
        
        # Verify the result
        assert result is True
        
        # Verify that vector_store_service.delete_by_document_id was called
        mock_delete_by_document_id.assert_called_once_with(self.document_id)
        
        # Verify the document was deleted from the mock S3 client
        assert key not in self.document_service.s3_client.mock_objects[self.document_service.bucket_name]

    def test_text_extraction(self):
        """Test text extraction from different file types."""
        # Test PDF extraction
        pdf_text = self.document_service._extract_text_from_pdf(self.mock_pdf_file)
        assert isinstance(pdf_text, str)
        
        # Test text splitting
        chunks = self.document_service._split_text("This is a test document. " * 100, chunk_size=100, overlap=20)
        assert len(chunks) > 1
        
        # Test handling of unsupported file types
        unsupported_file = BytesIO(b"Some content")
        unsupported_file.filename = "test.xyz"
        unsupported_text = self.document_service._extract_text(unsupported_file)
        assert "Unsupported file format" in unsupported_text

    # Test the exported functions
    def test_exported_functions(self):
        """Test the exported functions that wrap the DocumentService methods."""
        with patch('services.document_service.document_service.process_document') as mock_process:
            mock_process.return_value = MagicMock()
            process_document(self.mock_pdf_file, self.concept_id)
            mock_process.assert_called_once_with(self.mock_pdf_file, self.concept_id)
            
        with patch('services.document_service.document_service.get_documents') as mock_get:
            mock_get.return_value = ([], 0)
            get_documents(self.concept_id)
            mock_get.assert_called_once_with(self.concept_id, None)
            
        with patch('services.document_service.document_service.delete_document_by_id') as mock_delete:
            mock_delete.return_value = True
            delete_document_by_id(self.document_id)
            mock_delete.assert_called_once_with(self.document_id)
