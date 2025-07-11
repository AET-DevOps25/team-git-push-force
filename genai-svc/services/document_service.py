import os
import uuid
import boto3
from werkzeug.utils import secure_filename
import pypdf
import docx
from typing import List, Tuple, Optional
import datetime

from genai_models.models.processed_document import ProcessedDocument
from services.vector_store import vector_store_service

class DocumentService:
    """Service for processing and managing documents"""
    
    def __init__(self):
        """Initialize the document service"""
        # Initialize S3/MinIO client
        self.s3_client = boto3.client(
            's3',
            endpoint_url=os.getenv('MINIO_URL', 'http://localhost:9000'),
            aws_access_key_id=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
            aws_secret_access_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
            region_name='us-east-1',
            config=boto3.session.Config(signature_version='s3v4')
        )
        self.bucket_name = os.getenv('MINIO_BUCKET', 'concepts')
        
        # Ensure bucket exists
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the S3/MinIO bucket exists"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
                print(f"Created bucket: {self.bucket_name}")
            except Exception as e:
                print(f"Error creating bucket: {e}")
    
    def process_document(self, file, concept_id: str) -> ProcessedDocument:
        """Process a document file and store it in S3 and the vector database"""
        # Generate a unique document ID
        document_id = str(uuid.uuid4())
        
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Extract text from the document
        text = self._extract_text(file)
        
        # Store the original file in S3/MinIO
        s3_key = f"{concept_id}/{document_id}/{filename}"
        try:
            file.seek(0)  # Reset file pointer to beginning
            self.s3_client.upload_fileobj(file, self.bucket_name, s3_key)
        except Exception as e:
            print(f"Error uploading file to S3: {e}")
        
        # Split text into chunks
        chunks = self._split_text(text)
        
        # Store chunks in vector database
        if chunks:
            metadatas = [{
                "document_id": document_id,
                "concept_id": concept_id,
                "filename": filename
            } for _ in chunks]
            
            vector_store_service.add_texts(texts=chunks, metadatas=metadatas)
        
        # Create and return processed document info
        return ProcessedDocument(
            id=document_id,
            filename=filename,
            concept_id=concept_id,
            upload_date=datetime.datetime.now().isoformat(),
            size=len(text),
            status="PROCESSED",
            chunk_count=len(chunks)
        )
    
    def _extract_text(self, file) -> str:
        """Extract text from various document formats"""
        filename = file.filename.lower()
        file.seek(0)  # Reset file pointer to beginning
        
        try:
            if filename.endswith('.pdf'):
                return self._extract_text_from_pdf(file)
            elif filename.endswith('.docx'):
                return self._extract_text_from_docx(file)
            elif filename.endswith('.txt'):
                return file.read().decode('utf-8')
            else:
                return f"Unsupported file format: {filename}"
        except Exception as e:
            print(f"Error extracting text: {e}")
            return f"Error processing file: {str(e)}"
    
    def _extract_text_from_pdf(self, file) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            pdf = pypdf.PdfReader(file)
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
        return text
    
    def _extract_text_from_docx(self, file) -> str:
        """Extract text from DOCX file"""
        text = ""
        try:
            doc = docx.Document(file)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            print(f"Error extracting text from DOCX: {e}")
        return text
    
    def _split_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks"""
        if not text:
            return []
        
        chunks = []
        for i in range(0, len(text), chunk_size - overlap):
            chunk = text[i:i + chunk_size]
            if chunk:
                chunks.append(chunk)
        
        return chunks
    
    def get_documents(self, concept_id: str, status: Optional[str] = None) -> Tuple[List[ProcessedDocument], int]:
        """Get documents for a specific concept"""
        # In a real implementation, this would query a database
        # For now, we'll just return an empty list and the count from the vector store
        count = vector_store_service.get_document_count(concept_id)
        return [], count
    
    def delete_document_by_id(self, document_id: str) -> bool:
        """Delete a document by ID"""
        # Delete from vector store
        success = vector_store_service.delete_by_document_id(document_id)
        
        # In a real implementation, we would also delete from S3/MinIO
        # and from a document metadata database
        
        return success

# Create a singleton instance
document_service = DocumentService()

# Export the functions for use in controllers
def process_document(file, concept_id: str) -> ProcessedDocument:
    return document_service.process_document(file, concept_id)

def get_documents(concept_id: str, status: Optional[str] = None) -> Tuple[List[ProcessedDocument], int]:
    return document_service.get_documents(concept_id, status)

def delete_document_by_id(document_id: str) -> bool:
    return document_service.delete_document_by_id(document_id)