from genai_models.models.processed_document import ProcessedDocument
from genai_models.models.upload_and_process_documents200_response import UploadAndProcessDocuments200Response
from genai_models.models.get_documents_for_concept200_response import GetDocumentsForConcept200Response
import connexion

# Import services
from services.document_service import process_document, get_documents, delete_document_by_id

def upload_and_process_documents(concept_id, files):
    """Upload and process documents for a concept"""
    processed_documents = []

    try:
        # Access files through connexion.request.files instead of expecting them as parameters
        if hasattr(connexion, 'request') and hasattr(connexion.request, 'files'):
            print(f"Processing files from connexion.request.files for concept: {concept_id}")
            for file_key in connexion.request.files:
                file_obj = connexion.request.files[file_key]
                print(f"Processing file: {file_obj.filename if hasattr(file_obj, 'filename') else 'unknown'}")
                if file_obj.filename:  # Only process files with names
                    processed_doc = process_document(file_obj, concept_id)
                    processed_documents.append(processed_doc)
        else:
            # Fallback: if files come as parameters (for testing)
            print(f"Processing files from parameters for concept: {concept_id}")
            for file in files:
                if hasattr(file, 'filename'):
                    print(f"Processing file: {file.filename}")
                    processed_doc = process_document(file, concept_id)
                    processed_documents.append(processed_doc)
                else:
                    print(f"Warning: File object missing filename attribute: {type(file)}")

        print(f"Successfully processed {len(processed_documents)} documents")
        
    except Exception as e:
        print(f"Error in upload_and_process_documents: {e}")
        raise

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