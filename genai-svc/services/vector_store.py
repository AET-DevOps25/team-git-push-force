import os
import weaviate
from weaviate.auth import AuthApiKey
from weaviate.embedded import EmbeddedOptions
from langchain_weaviate import WeaviateVectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings

class VectorStoreService:
    """Service for interacting with the Weaviate vector database"""

    def __init__(self):
        """Initialize the vector store service"""
        # Initialize Weaviate client
        weaviate_url = os.getenv("WEAVIATE_URL", "http://localhost:8080")
        weaviate_api_key = os.getenv("WEAVIATE_API_KEY", None)

        auth_config = weaviate.auth.AuthApiKey(api_key=weaviate_api_key) if weaviate_api_key else None

        try:
            # Create connection config
            # For Weaviate v4, we need to specify both HTTP and gRPC ports
            # Get gRPC port from environment variable or calculate it
            grpc_port = int(os.getenv("WEAVIATE_GRPC_PORT", 0))
            if grpc_port == 0:
                # Default gRPC port is typically HTTP port + 1 (e.g., 8080 -> 8081)
                http_port = int(weaviate_url.split(":")[-1])
                grpc_port = http_port + 1

            print(f"Using gRPC port: {grpc_port}")

            connection_params = weaviate.connect.ConnectionParams.from_url(
                url=weaviate_url,
                grpc_port=grpc_port
            )

            # Add authentication if provided
            if auth_config:
                connection_params = connection_params.with_auth(auth_config)

            # Initialize client with v4 API
            self.client = weaviate.WeaviateClient(
                connection_params=connection_params,
                skip_init_checks=True  # Skip initialization checks to avoid gRPC issues
            )

            # Connect to Weaviate
            self.client.connect()
            print(f"Connected to Weaviate at {weaviate_url}")

            # Create schema if it doesn't exist
            self._ensure_schema_exists()

            # Initialize embeddings model
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )

            # Initialize vector store
            self.vector_store = WeaviateVectorStore(
                client=self.client,
                index_name="Documents",
                text_key="content",
                embedding=self.embeddings
            )

        except Exception as e:
            print(f"Error connecting to Weaviate: {e}")
            # Create a fallback client for testing
            self.client = None
            self.vector_store = None
            self.embeddings = None

    def _ensure_schema_exists(self):
        """Ensure the required schema exists in Weaviate"""
        # Get collections to check if Documents collection exists
        try:
            # Try to get the Documents collection
            # If it exists, this will succeed
            self.client.collections.get("Documents")
            print("Documents collection already exists in Weaviate")
        except Exception:
            # If the collection doesn't exist, create it
            from weaviate.classes.config import Property, DataType, Configure

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
            print("Created Documents collection in Weaviate")

    def add_texts(self, texts, metadatas=None):
        """Add texts to the vector store"""
        if not self.vector_store:
            print("Vector store not available")
            return []

        try:
            return self.vector_store.add_texts(texts=texts, metadatas=metadatas)
        except Exception as e:
            print(f"Error adding texts to vector store: {e}")
            return []

    def get_retriever(self, concept_id=None):
        """Get a retriever for the vector store, optionally filtered by concept_id"""
        if not self.vector_store:
            print("Vector store not available")
            return None

        search_kwargs = {}

        # Add filter for concept_id if provided
        if concept_id:
            search_kwargs["filter"] = {
                "path": ["concept_id"],
                "operator": "Equal",
                "valueString": concept_id
            }

        return self.vector_store.as_retriever(
            search_kwargs=search_kwargs
        )

    def delete_by_document_id(self, document_id):
        """Delete all chunks for a specific document"""
        if not self.client:
            print("Weaviate client not available")
            return False

        try:
            # Create a filter for document_id
            from weaviate.query import Filter

            filter_by_doc_id = Filter.by_property("document_id").equal(document_id)

            # Delete objects with the specified document_id
            self.client.collections.get("Documents").data.delete_many(
                filters=filter_by_doc_id
            )
            return True
        except Exception as e:
            print(f"Error deleting document from vector store: {e}")
            return False

    def get_document_count(self, concept_id=None):
        """Get the count of documents, optionally filtered by concept_id"""
        if not self.client:
            print("Weaviate client not available")
            return 0

        try:
            # Get the Documents collection
            collection = self.client.collections.get("Documents")

            # Create filter if concept_id is provided
            if concept_id:
                from weaviate.query import Filter
                filter_by_concept = Filter.by_property("concept_id").equal(concept_id)
                count = collection.aggregate.count(filters=filter_by_concept)
            else:
                count = collection.aggregate.count()

            return count
        except Exception as e:
            print(f"Error getting document count: {e}")
            return 0

    def close(self):
        """Close the Weaviate client connection"""
        if self.client:
            try:
                self.client.close()
                print("Weaviate client connection closed")
            except Exception as e:
                print(f"Error closing Weaviate client connection: {e}")

    def __del__(self):
        """Destructor to ensure the connection is closed when the object is garbage collected"""
        self.close()

# Create a singleton instance
vector_store_service = VectorStoreService()
