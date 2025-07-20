import os
import uuid
import boto3
import requests
import pytest
from io import BytesIO

@pytest.mark.skipif(os.getenv("SKIP_MINIO", "false").lower() == "true",
                   reason="Skipping MinIO integration test when SKIP_MINIO is true")
def test_minio_integration():
    """
    Test the integration between GenAI service and MinIO.
    This script demonstrates how to:
    1. Upload a PDF directly to MinIO
    2. List documents in MinIO
    3. Delete a document from MinIO
    
    This test is skipped when SKIP_MINIO environment variable is set to true.
    """
    print("Testing MinIO integration with GenAI service...")
    
    # MinIO connection parameters (same as in document_service.py)
    minio_url = os.getenv('MINIO_URL', 'http://localhost:9000')
    minio_access_key = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
    minio_secret_key = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
    bucket_name = os.getenv('MINIO_BUCKET', 'concepts')
    
    # Initialize S3 client for MinIO
    s3_client = boto3.client(
        's3',
        endpoint_url=minio_url,
        aws_access_key_id=minio_access_key,
        aws_secret_access_key=minio_secret_key,
        region_name='us-east-1',
        config=boto3.session.Config(signature_version='s3v4')
    )
    
    # Create a test concept ID and document ID
    concept_id = str(uuid.uuid4())
    document_id = str(uuid.uuid4())
    filename = "test_document.pdf"
    
    # Create a sample PDF file (or download one)
    pdf_content = None
    try:
        # Try to download a sample PDF from the web
        response = requests.get("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
        if response.status_code == 200:
            pdf_content = BytesIO(response.content)
            print("Downloaded sample PDF from the web")
        else:
            raise Exception("Failed to download sample PDF")
    except Exception as e:
        print(f"Error downloading sample PDF: {e}")
        # Create a minimal PDF content as fallback
        pdf_content = BytesIO(b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000120 00000 n\n0000000210 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n300\n%%EOF")
        print("Created minimal PDF content")
    
    # 1. Upload the PDF to MinIO
    s3_key = f"{concept_id}/{document_id}/{filename}"
    try:
        pdf_content.seek(0)  # Reset file pointer to beginning
        s3_client.upload_fileobj(pdf_content, bucket_name, s3_key)
        print(f"Successfully uploaded PDF to MinIO: s3://{bucket_name}/{s3_key}")
    except Exception as e:
        print(f"Error uploading PDF to MinIO: {e}")
        return
    
    # 2. List objects in the bucket to verify upload
    try:
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=f"{concept_id}/"
        )
        
        if 'Contents' in response:
            print("\nObjects in MinIO bucket:")
            for obj in response['Contents']:
                print(f"  - {obj['Key']} ({obj['Size']} bytes)")
        else:
            print("No objects found in the bucket")
    except Exception as e:
        print(f"Error listing objects in MinIO: {e}")
    
    # 3. Delete the document from MinIO
    try:
        s3_client.delete_object(
            Bucket=bucket_name,
            Key=s3_key
        )
        print(f"\nSuccessfully deleted PDF from MinIO: s3://{bucket_name}/{s3_key}")
    except Exception as e:
        print(f"Error deleting PDF from MinIO: {e}")
    
    # 4. Verify deletion
    try:
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=f"{concept_id}/"
        )
        
        if 'Contents' not in response or len(response['Contents']) == 0:
            print("Verification successful: Document was deleted from MinIO")
        else:
            print("Verification failed: Document still exists in MinIO")
            for obj in response['Contents']:
                print(f"  - {obj['Key']}")
    except Exception as e:
        print(f"Error verifying deletion in MinIO: {e}")
