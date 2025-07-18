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
        documents = []

        try:
            # List all objects in the bucket with the concept_id prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{concept_id}/"
            )

            # If no objects found, return empty list
            if 'Contents' not in response:
                return [], 0

            # Group objects by document_id (second level in the path)
            document_map = {}
            for obj in response.get('Contents', []):
                # Parse the key: concept_id/document_id/filename
                parts = obj['Key'].split('/')
                if len(parts) >= 3:
                    doc_id = parts[1]
                    filename = parts[2]

                    if doc_id not in document_map:
                        document_map[doc_id] = {
                            'id': doc_id,
                            'filename': filename,
                            'size': obj['Size'],
                            'last_modified': obj['LastModified']
                        }

            # Get document metadata from vector store if available
            for doc_id, doc_info in document_map.items():
                # Default status if not specified
                doc_status = status if status else "COMPLETED"

                # Create the document object
                document = ProcessedDocument(
                    id=doc_id,
                    filename=doc_info['filename'],
                    type="OTHER",  # Default type
                    status=doc_status,
                    s3_location=f"s3://{self.bucket_name}/{concept_id}/{doc_id}/{doc_info['filename']}",
                    uploaded_at=doc_info['last_modified'].isoformat(),
                    processed_at=doc_info['last_modified'].isoformat()
                )

                documents.append(document)

            # Get the total count from vector store for consistency
            count = vector_store_service.get_document_count(concept_id)
            if count == 0 and documents:
                # If vector store has no count but we found documents in MinIO,
                # use the document count from MinIO
                count = len(documents)

            return documents, count

        except Exception as e:
            print(f"Error retrieving documents from MinIO: {e}")
            # Fallback to vector store count
            count = vector_store_service.get_document_count(concept_id)
            return [], count

    def delete_document_by_id(self, document_id: str) -> bool:
        """Delete a document by ID"""
        # Delete from vector store
        vector_store_success = vector_store_service.delete_by_document_id(document_id)

        # Delete from MinIO
        minio_success = False
        try:
            # First, we need to find all objects with this document_id
            # Since we don't know the concept_id, we need to list all objects and filter
            paginator = self.s3_client.get_paginator('list_objects_v2')

            # Find all objects in the bucket
            objects_to_delete = []
            for page in paginator.paginate(Bucket=self.bucket_name):
                if 'Contents' not in page:
                    continue

                for obj in page['Contents']:
                    # Check if the document_id is in the key path
                    # The format is concept_id/document_id/filename
                    parts = obj['Key'].split('/')
                    if len(parts) >= 2 and parts[1] == document_id:
                        objects_to_delete.append({'Key': obj['Key']})

            # If we found objects to delete
            if objects_to_delete:
                # Delete the objects
                self.s3_client.delete_objects(
                    Bucket=self.bucket_name,
                    Delete={'Objects': objects_to_delete}
                )
                minio_success = True
                print(f"Deleted {len(objects_to_delete)} objects from MinIO for document {document_id}")
            else:
                print(f"No objects found in MinIO for document {document_id}")
                # If no objects found, consider it a success
                minio_success = True

        except Exception as e:
            print(f"Error deleting document from MinIO: {e}")
            minio_success = False

        # Return overall success status
        return vector_store_success and minio_success

    def close(self):
        """Close the S3 client connection"""
        if hasattr(self, 's3_client') and self.s3_client:
            try:
                # Close any open connections
                session = self.s3_client.meta.session
                if session:
                    session.close()
                print("S3 client connection closed")
            except Exception as e:
                print(f"Error closing S3 client connection: {e}")

    def __del__(self):
        """Destructor to ensure the connection is closed when the object is garbage collected"""
        self.close()

# Create a singleton instance
document_service = DocumentService()

# Export the functions for use in controllers
def process_document(file, concept_id: str) -> ProcessedDocument:
    return document_service.process_document(file, concept_id)

def get_documents(concept_id: str, status: Optional[str] = None) -> Tuple[List[ProcessedDocument], int]:
    return document_service.get_documents(concept_id, status)

def delete_document_by_id(document_id: str) -> bool:
    return document_service.delete_document_by_id(document_id)
