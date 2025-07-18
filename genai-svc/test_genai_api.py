import os
import uuid
import requests
import json
from io import BytesIO

def test_genai_api():
    """
    Test the GenAI service API for document operations.
    This script demonstrates how to:
    1. Upload a document through the GenAI API
    2. Retrieve documents for a concept
    3. Delete a document
    """
    print("Testing GenAI service API for document operations...")
    
    # API endpoint (adjust if needed)
    api_base_url = os.getenv('GENAI_API_URL', 'http://localhost:8083')
    
    # Create a test concept ID
    concept_id = str(uuid.uuid4())
    print(f"Using test concept ID: {concept_id}")
    
    # Create a sample PDF file
    pdf_content = BytesIO(b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000120 00000 n\n0000000210 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n300\n%%EOF")
    
    # 1. Upload a document through the GenAI API
    upload_url = f"{api_base_url}/api/genai/documents?conceptId={concept_id}"
    
    # Prepare the file for upload
    files = {
        'files': ('test_api_document.pdf', pdf_content.getvalue(), 'application/pdf')
    }
    
    try:
        # Make the upload request
        print("\n1. Uploading document through GenAI API...")
        response = requests.post(upload_url, files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("Upload successful!")
            print(f"Response: {json.dumps(result, indent=2)}")
            
            # Extract the document ID for later use
            if 'processedDocuments' in result and len(result['processedDocuments']) > 0:
                document_id = result['processedDocuments'][0]['id']
                print(f"Document ID: {document_id}")
            else:
                print("No document ID returned")
                return
        else:
            print(f"Upload failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return
    except Exception as e:
        print(f"Error uploading document: {e}")
        return
    
    # 2. Retrieve documents for the concept
    get_docs_url = f"{api_base_url}/api/genai/concepts/{concept_id}/documents"
    
    try:
        print("\n2. Retrieving documents for concept...")
        response = requests.get(get_docs_url)
        
        if response.status_code == 200:
            result = response.json()
            print("Document retrieval successful!")
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print(f"Document retrieval failed with status code {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error retrieving documents: {e}")
    
    # 3. Delete the document
    delete_url = f"{api_base_url}/api/genai/documents/{document_id}"
    
    try:
        print("\n3. Deleting document...")
        response = requests.delete(delete_url)
        
        if response.status_code == 204:
            print("Document deletion successful!")
        else:
            print(f"Document deletion failed with status code {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error deleting document: {e}")
    
    # 4. Verify deletion by retrieving documents again
    try:
        print("\n4. Verifying deletion...")
        response = requests.get(get_docs_url)
        
        if response.status_code == 200:
            result = response.json()
            if 'documents' in result and len(result['documents']) == 0:
                print("Verification successful: Document was deleted")
            else:
                print("Verification failed: Document still exists")
                print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print(f"Verification failed with status code {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error verifying deletion: {e}")

if __name__ == "__main__":
    test_genai_api()