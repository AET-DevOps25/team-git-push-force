from genai_models.models.processed_document import ProcessedDocument
from genai_models.models.upload_and_process_documents200_response import UploadAndProcessDocuments200Response
from genai_models.models.get_documents_for_concept200_response import GetDocumentsForConcept200Response
import connexion

# Import services
from services.document_service import process_document, get_documents, delete_document_by_id

def upload_and_process_documents(concept_id, files):
    """Upload and process documents for a concept"""
    processed_documents = []

    for file in files:
        processed_doc = process_document(file, concept_id)
        processed_documents.append(processed_doc)

    return UploadAndProcessDocuments200Response(
        processed_documents=processed_documents
    )

def get_documents_for_concept(concept_id, status=None):
    """Get documents for a specific concept"""
    documents, total_count = get_documents(concept_id, status)
    
    return GetDocumentsForConcept200Response(
        documents=documents,
        total_count=total_count
    )

def delete_document(document_id):
    """Delete a document by ID"""
    delete_document_by_id(document_id)
    return None, 204