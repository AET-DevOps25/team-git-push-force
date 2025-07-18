import os
import time
import requests
import weaviate
from weaviate.auth import AuthApiKey
from weaviate.embedded import EmbeddedOptions
from langchain_weaviate import WeaviateVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from weaviate.collections.classes.filters import Filter



class VectorStoreService:
    """Service for managing vector storage and retrieval operations"""

    def __init__(self):
        """Initialize the vector store service"""
        self.client = None
        self.vector_store = None
        self.embeddings = None
        self._initialize_weaviate_client()

    def _wait_for_weaviate_ready(self, weaviate_url, timeout=120, check_interval=5):
        """Wait for Weaviate to be ready and responding to requests

        Args:
            weaviate_url (str): URL of the Weaviate instance
            timeout (int): Maximum time to wait in seconds
            check_interval (int): Time between checks in seconds

        Returns:
            bool: True if Weaviate is ready, False if timeout occurred
        """
        print(f"Waiting for Weaviate to be ready at {weaviate_url}...")
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                # First try the v1 ready endpoint
                try:
                    response = requests.get(f"{weaviate_url}/v1/.well-known/ready", timeout=5)
                    if response.status_code == 200:
                        ready_data = response.json()
                        ready_status = ready_data.get("ready", False)
                        if ready_status:
                            print(f"Weaviate is ready after {time.time() - start_time:.2f} seconds")
                            return True
                        else:
                            print(f"Weaviate endpoint reached but service reports not ready: {ready_data}")
                except (requests.RequestException, ValueError) as e:
                    # Try the legacy meta endpoint as fallback
                    print(f"Error with v1 ready endpoint: {e}, trying legacy endpoint")
                    try:
                        response = requests.get(f"{weaviate_url}/v1/meta", timeout=5)
                        if response.status_code == 200:
                            print(f"Weaviate meta endpoint accessible after {time.time() - start_time:.2f} seconds")
                            return True
                    except (requests.RequestException, ValueError) as e2:
                        print(f"Weaviate not yet ready (meta endpoint): {e2}")
            except Exception as e:
                print(f"Unexpected error checking Weaviate readiness: {e}")

            # Wait before next check
            time.sleep(check_interval)
            print(f"Waited {time.time() - start_time:.2f}s for Weaviate readiness...")

        print(f"Timed out after {timeout} seconds waiting for Weaviate to be ready")
        return False

    def _initialize_weaviate_client(self):
        """Initialize and configure the Weaviate client"""
        # Skip Weaviate connection if SKIP_WEAVIATE env var is set
        if os.getenv("SKIP_WEAVIATE", "false").lower() == "true":
            print("SKIP_WEAVIATE is set. Mocking Weaviate client for tests.")
            class MockWeaviateClient:
                def __init__(self):
                    pass
                def __getattr__(self, name):
                    def method(*args, **kwargs):
                        return None
                    return method
            self.client = MockWeaviateClient()
            return
        try:
            # Get Weaviate configuration from environment variables
            weaviate_url = os.getenv("WEAVIATE_URL", "http://localhost:8080")
            weaviate_api_key = os.getenv("WEAVIATE_API_KEY", None)
            use_embedded = os.getenv("WEAVIATE_USE_EMBEDDED", "false").lower() == "true"
            grpc_port = int(os.getenv("WEAVIATE_GRPC_PORT", "50051"))

            # Perform readiness check for Docker Compose setup
            if not use_embedded and not weaviate_url.startswith("http://localhost"):
                self._wait_for_weaviate_ready(weaviate_url, timeout=60, check_interval=5)

            # Initialize client with appropriate configuration
            if use_embedded:
                # Use embedded Weaviate for local development and testing
                print("Initializing embedded Weaviate client")
                embedded_options = EmbeddedOptions()
                self.client = weaviate.Client(embedded_options=embedded_options)
            else:
                # Use external Weaviate instance (Docker or managed service)
                print(f"Connecting to Weaviate at {weaviate_url}")

                # Parse URL to extract host and port
                from urllib.parse import urlparse
                parsed_url = urlparse(weaviate_url)
                host = parsed_url.hostname
                port = parsed_url.port or 8080

                # Use the modern v4 client connection approach
                if weaviate_api_key:
                    # With authentication
                    self.client = weaviate.connect_to_local(
                        host=host,
                        port=port,
                        grpc_port=grpc_port,
                        auth_credentials=AuthApiKey(api_key=weaviate_api_key)
                    )
                else:
                    # Without authentication
                    self.client = weaviate.connect_to_local(
                        host=host,
                        port=port,
                        grpc_port=grpc_port
                    )

            # Ensure required schema exists
            self._ensure_schema_exists()

            # Initialize embeddings model
            # If transformers inference is available via API, use SentenceTransformer model
            # Otherwise fall back to local embeddings
            transformers_inference_api = os.getenv("TRANSFORMERS_INFERENCE_API", None)
            model_name = "sentence-transformers/all-MiniLM-L6-v2"

            print(f"Initializing embeddings model with {model_name}")
            try:
                # Try with the current version
                self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
            except Exception as e:
                print(f"Error initializing HuggingFaceEmbeddings: {e}")
                # Fallback - try with direct SentenceTransformers import if HuggingFace wrapper fails
                from sentence_transformers import SentenceTransformer
                from langchain_core.embeddings import Embeddings

                class SentenceTransformerEmbeddings(Embeddings):
                    def __init__(self, model_name):
                        self.model = SentenceTransformer(model_name)

                    def embed_documents(self, texts):
                        embeddings = self.model.encode(texts)
                        return embeddings.tolist()

                    def embed_query(self, text):
                        embedding = self.model.encode(text)
                        return embedding.tolist()

                print("Using fallback SentenceTransformerEmbeddings implementation")
                self.embeddings = SentenceTransformerEmbeddings(model_name=model_name)

            # Initialize vector store with Weaviate client
            # For langchain-weaviate 0.0.5, use attributes parameter
            print("Initializing vector store with langchain-weaviate 0.0.5")
            self.vector_store = WeaviateVectorStore(
                client=self.client,
                index_name="Documents",
                text_key="content", 
                embedding=self.embeddings,
                attributes=["document_id", "concept_id", "filename"]
            )

            print("Vector store service initialized successfully")

        except Exception as e:
            print(f"Failed to initialize vector store service: {e}")
            # Reraise to prevent service from starting with broken vector store
            raise

    def _ensure_schema_exists(self):
        """Ensure the required schema exists in Weaviate"""
        # Get collections to check if Documents collection exists
        max_retries = 3
        retry_delay = 2  # seconds

        # Additional check for readiness before attempting to access collections
        # This helps prevent "leader not found" errors
        weaviate_url = os.getenv("WEAVIATE_URL", "http://localhost:8080")
        self._wait_for_weaviate_ready(weaviate_url, timeout=30, check_interval=2)

        # First, try to see if collection exists and check its properties
        collection_exists = False
        has_required_properties = False

        for attempt in range(max_retries):
            try:
                # Try to get the Documents collection
                docs_collection = self.client.collections.get("Documents")
                collection_exists = True
                print("Documents collection exists in Weaviate")

                # Check if it has all required properties
                try:
                    properties = docs_collection.config.get().properties
                    property_names = [p.name for p in properties]
                    required_props = ["content", "document_id", "concept_id", "filename"]
                    missing_props = [p for p in required_props if p not in property_names]

                    if not missing_props:
                        print("All required properties exist in schema")
                        has_required_properties = True
                        return
                    else:
                        print(f"Missing properties in schema: {missing_props}")
                        # We need to delete and recreate the collection
                        self.client.collections.delete("Documents")
                        collection_exists = False
                        break
                except Exception as prop_err:
                    print(f"Error checking properties: {prop_err}")
                    break
            except weaviate.exceptions.UnexpectedStatusCodeError as e:
                if "leader not found" in str(e):
                    print(f"Leader not found error (attempt {attempt+1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        continue
                    else:
                        print("Max retries reached for leader not found error")
                        break
                else:
                    # Collection probably doesn't exist
                    print(f"Collection does not exist: {e}")
                    break
            except Exception as e:
                print(f"Unexpected error checking collection: {e}")
                break

        # If we need to create or recreate the collection
        if not collection_exists or not has_required_properties:
            try:
                # Delete collection if it exists but is incomplete
                if collection_exists and not has_required_properties:
                    try:
                        self.client.collections.delete("Documents")
                        print("Deleted existing incomplete collection")
                    except Exception as del_err:
                        print(f"Error deleting collection: {del_err}")

                # Import required classes for schema creation
                from weaviate.classes.config import Property, DataType

                # Define properties for our collection
                properties = [
                    Property(
                        name="content",
                        data_type=DataType.TEXT,
                        description="The text content of the document chunk"
                    ),
                    Property(
                        name="document_id",
                        data_type=DataType.TEXT,
                        description="The ID of the document"
                    ),
                    Property(
                        name="concept_id",
                        data_type=DataType.TEXT,
                        description="The ID of the concept this document belongs to"
                    ),
                    Property(
                        name="filename",
                        data_type=DataType.TEXT,
                        description="The original filename"
                    )
                ]

                # Create the collection
                self.client.collections.create(
                    name="Documents",
                    description="A collection to store document chunks for retrieval",
                    properties=properties
                )
                print("Created Documents collection with all required properties")

            except Exception as create_err:
                print(f"Error creating schema: {create_err}")

    def add_texts(self, texts, metadatas, **kwargs):
        """Add texts to the vector store"""
        return self.vector_store.add_texts(texts=texts, metadatas=metadatas, **kwargs)

    def get_retriever(self, concept_id=None):
        """Get a retriever for the vector store, optionally filtered by concept_id

        Args:
            concept_id (str, optional): The concept ID to filter documents by. If None, all documents are retrieved.

        Returns:
            A LangChain retriever that will fetch documents from the vector store
        """
        print(f"Creating retriever for concept_id: {concept_id}")

        # Skip custom retriever implementation due to Pydantic issues
        # Use standard retriever from vector store with search_kwargs
        if concept_id:
            # Create a Filter object directly using the Filter class from weaviate
            filters = Filter.by_property("concept_id").equal(concept_id)
            print(f"Creating filtered retriever with Filter object for concept_id: {concept_id}")

            # Use the built-in as_retriever method with proper Filter object
            return self.vector_store.as_retriever(
                search_kwargs={
                    "k": 10,
                    "filters": filters
                }
            )
        else:
            # No filter needed
            print("Creating standard retriever without filters")
            return self.vector_store.as_retriever(search_kwargs={"k": 10})

    def delete_by_document_id(self, document_id):
        """Delete all chunks associated with a specific document_id"""
        try:
            # Get collection and create a query
            collection = self.client.collections.get("Documents")

            # Query to find objects with the matching document_id
            result = collection.query.fetch_objects(
                filters=collection.query.filter.by_property("document_id").equal(document_id)
            )

            # If objects were found, delete them
            if result.objects:
                print(f"Found {len(result.objects)} chunks for document ID {document_id}")
                for obj in result.objects:
                    # Delete each object by its ID
                    collection.data.delete_by_id(obj.uuid)
                print(f"Successfully deleted all chunks for document ID {document_id}")
                return True
            else:
                print(f"No chunks found for document ID {document_id}")
                return False

        except Exception as e:
            print(f"Error deleting document chunks: {e}")
            return False

    def get_document_count(self, document_id: str) -> int:
        """
        Gets the number of vectors for a given document ID.
        Args:
            document_id: The ID of the document.
        Returns:
            The number of vectors for the document.
        """
        try:
            # Define the filter to find objects with the matching document_id
            # Create a Filter object directly using the Filter class from weaviate
            filters = Filter.by_property("document_id").equal(document_id)

            # Perform the aggregation query using the Filter object
            result = self.vector_store.aggregate.over_all(filters=filters)

            return result.total_count

        except Exception as e:
            # Log the exception for debugging purposes
            print(f"An error occurred while getting document count: {e}")
            # Optionally, re-raise the exception if you want the caller to handle it
            # raise
            return 0

    def close(self):
        """Close the Weaviate client connection"""
        try:
            if self.client:
                # Check if client has a close method (newer versions of weaviate-client)
                if hasattr(self.client, 'close'):
                    self.client.close()
                    print("Closed Weaviate client connection")
                # For embedded client, check if there's a specific shutdown method
                elif hasattr(self.client, '_connection') and hasattr(self.client._connection, 'embedded_db'):
                    # Handle embedded DB shutdown if needed
                    if hasattr(self.client._connection.embedded_db, 'stop'):
                        self.client._connection.embedded_db.stop()
                        print("Stopped embedded Weaviate database")
        except Exception as e:
            print(f"Error closing Weaviate client: {e}")

    def __del__(self):
        """Destructor to ensure connections are closed"""
        self.close()


# Singleton instance
vector_store_service = VectorStoreService()
