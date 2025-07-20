import os
import warnings
from typing import List, Dict, Any, Optional

from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain_community.llms.fake import FakeListLLM
from langchain.schema.runnable import RunnablePassthrough

from genai_models.models.chat_request import ChatRequest
from genai_models.models.chat_response import ChatResponse
from genai_models.models.initialize_chat_for_concept_request import InitializeChatForConceptRequest

# Import custom OpenWebUI LLM
from openwebui_llm import OpenWebUILLM

# Import services
from services.vector_store import vector_store_service
from services.concept_extractor import concept_extractor
from services.response_generator import response_generator
from services.welcome_generator import welcome_generator
from services.conversation_history_service import conversation_history_service


class LLMService:
    """Service for interacting with language models"""

    def __init__(self):
        """Initialize the LLM service"""
        # Try to use the OpenWebUI LLM, fall back to FakeListLLM if not available
        try:
            # Initialize the OpenWebUI LLM with the Llama3 model
            self.llm = OpenWebUILLM(
                model_name=os.getenv("OPENWEBUI_MODEL", "llama3"),
                temperature=0.7,
                max_tokens=2048  # Increased token count to ensure full JSON can be generated
            )
            print("Successfully initialized OpenWebUI LLM")
        except Exception as e:
            print(f"Warning: Could not initialize OpenWebUI LLM: {e}")
            print("Falling back to FakeListLLM")
            # Fall back to FakeListLLM if OpenWebUI is not available
            self.llm = FakeListLLM(
                        responses=["""I understand you're interested in planning an event. Here's a concept based on the information provided.

        ```json
        {
          "title": "Sample Conference",
          "eventDetails": {
            "theme": "Technology and Innovation",
            "format": "HYBRID",
            "capacity": 250,
            "duration": "2 days",
            "targetAudience": "Technology professionals and enthusiasts",
            "location": "Tech Hub Conference Center"
          },
          "agenda": [
            {
              "time": "9:00 AM",
              "title": "Opening Keynote",
              "type": "KEYNOTE",
              "duration": 60
            },
            {
              "time": "10:30 AM",
              "title": "Networking Break",
              "type": "BREAK",
              "duration": 30
            }
          ],
          "notes": "This is a placeholder response from the development environment"
        }
        ```"""],
                temperature=0.7,
            )

        # Initialize prompt templates
        # Main prompt template for both direct LLM calls and retrieval chain
        self.chat_prompt = PromptTemplate(
            input_variables=["context", "question", "chat_history"],
            template=r"""You are an AI assistant for event planning and concept development.
            
            Use the provided context and chat history to answer the user's question. For EVERY response, always provide your answer in two parts:
            1. A conversational answer to the user's question, referencing context and history.
            2. A JSON object for the event concept, with updates based on the user's message.
            
            IMPORTANT: Only update the fields mentioned by the user in their message. Do not change other fields.
            Use conceptUpdates to make partial changes to the concept. If the user doesn't mention a specific field,
            keep its current value from the context.
            
            ```json
            {{
              "title": "Event Title",
              "description": "Description of the event concept.",
              "status": "DRAFT|IN_PROGRESS|COMPLETED|ARCHIVED",
              "eventDetails": {{
                "theme": "Theme or Focus",
                "format": "PHYSICAL|VIRTUAL|HYBRID",
                "capacity": 500,
                "duration": "2 days",
                "targetAudience": "Description of target audience",
                "location": "Location if applicable"
              }},
              "agenda": [
                {{
                  "time": "9:00 AM",
                  "title": "Opening Keynote",
                  "type": "KEYNOTE|WORKSHOP|PANEL|NETWORKING|BREAK|LUNCH",
                  "duration": 60
                }}
              ],
              "speakers": [
                {{
                  "name": "Speaker Name",
                  "expertise": "Speaker's expertise or role",
                  "suggestedTopic": "Suggested presentation topic"
                }}
              ],
              "pricing": {{
                "currency": "USD",
                "earlyBird": 299,
                "regular": 399,
                "vip": 599,
                "student": 99
              }},
              "notes": "Any additional information",
              "reasoning": "Why this concept would work well"
            }}
            ```
            
            If you do not know a value, use an empty string or null. Do not invent information. Do not include the 'id' field, it is provided by the system. Do not include the JSON in the conversational response.
            
            Event Concept Context: {context}
            Previous Conversation: {chat_history}
            Current Question: {question}
            Answer:"""
        )

        # Question generator prompt for retrieval chain
        self.question_generator_prompt = PromptTemplate(
            input_variables=["chat_history", "question"],
            template=r"""You are an AI assistant specializing in event planning and concept development.

            Given the following conversation history about event planning and a follow-up question, 
            rephrase the follow-up question to be a standalone question that captures all relevant 
            context about the event concept being discussed.

            Make sure your standalone question:
            1. Incorporates key details about the event concept from the conversation history
            2. Maintains the original intent of the follow-up question
            3. Is phrased in a way that will help generate a comprehensive response about event planning

            Chat History:
            {chat_history}

            Follow Up Input: {question}

            Standalone question:"""
        )

        # Initialize the other services with this LLM
        response_generator.concept_extractor = concept_extractor
        welcome_generator.llm = self.llm

    def process_chat_request(self, chat_request: ChatRequest) -> ChatResponse:
        """Process a chat request and generate a response"""
        # Extract message and context
        message = chat_request.message
        concept = chat_request.concept
        concept_id = concept.id if concept else None

        # Get chat history - format it properly for the prompt
        chat_history_str = ""
        chat_history_tuples = []
        
        # Get conversation ID from the request
        conversation_id = getattr(chat_request, 'conversation_id', None)
        
        # Try to get conversation history from the service if we have a conversation ID
        if conversation_id:
            print(f"Retrieving conversation history for conversation ID: {conversation_id}")
            # Get formatted history from the conversation history service
            server_history_str, server_history_tuples = conversation_history_service.get_formatted_history(conversation_id)
            
            if server_history_str:
                chat_history_str = server_history_str
                chat_history_tuples = server_history_tuples
                print(f"Retrieved {len(server_history_tuples)} conversation pairs from server history")
            else:
                print(f"No server-side history found for conversation ID: {conversation_id}")
        
        # If client also provided history, use it as a fallback or merge it with server history
        client_history_provided = False
        if hasattr(chat_request, 'context') and chat_request.context and hasattr(chat_request.context, 'previous_messages') and chat_request.context.previous_messages:
            client_history_provided = True
            print(f"Found {len(chat_request.context.previous_messages)} previous messages in client-provided history")
            
            # If we don't have server history, use client history
            if not chat_history_str:
                chat_history_lines = []
                
                # Group messages by role for proper conversation flow
                current_user_message = ""
                current_assistant_message = ""
                
                for msg in chat_request.context.previous_messages:
                    if hasattr(msg, 'role') and msg.role and hasattr(msg, 'content') and msg.content:
                        if msg.role == "user":
                            # If we have a complete pair, add it to tuples
                            if current_user_message and current_assistant_message:
                                chat_history_tuples.append((current_user_message, current_assistant_message))
                                current_user_message = ""
                                current_assistant_message = ""
                            
                            # Set the current user message
                            current_user_message = msg.content
                            chat_history_lines.append(f"User: {msg.content}")
                        elif msg.role == "assistant":
                            current_assistant_message = msg.content
                            chat_history_lines.append(f"Assistant: {msg.content}")
                
                # Add the last pair if we have both parts
                if current_user_message and current_assistant_message:
                    chat_history_tuples.append((current_user_message, current_assistant_message))
                
                chat_history_str = "\n".join(chat_history_lines)
                print(f"Using client-provided history as fallback")
        
        if not chat_history_str:
            print("No conversation history found (neither server-side nor client-provided)")
            
        print(f"Using {len(chat_history_tuples)} conversation pairs for LLM context")

        # Prepare enhanced message with concept info if available
        enhanced_message = message
        concept_context = ""
        if concept:
            # Get concept details directly from the request
            concept_details = []
            if hasattr(concept, 'title') and concept.title:
                concept_details.append(f"Title: {concept.title}")
            if hasattr(concept, 'description') and concept.description:
                concept_details.append(f"Description: {concept.description}")
            if hasattr(concept.event_details, 'format') and concept.event_details.format:
                concept_details.append(f"Format: {concept.event_details.format}")
            if hasattr(concept.event_details, 'targetAudience') and concept.event_details.targetAudience:
                concept_details.append(f"Target Audience: {concept.event_details.targetAudience}")
            if hasattr(concept.event_details, 'theme') and concept.event_details.theme:
                concept_details.append(f"Theme: {concept.event_details.theme}")
            if hasattr(concept.event_details, 'capacity') and concept.event_details.capacity:
                concept_details.append(f"Capacity: {concept.event_details.capacity}")
            if hasattr(concept.event_details, 'duration') and concept.event_details.duration:
                concept_details.append(f"Duration: {concept.event_details.duration}")
            if hasattr(concept.event_details, 'location') and concept.event_details.location:
                concept_details.append(f"Location: {concept.event_details.location}")

            concept_context = "\n".join(concept_details)

            if concept_context:
                enhanced_message = f"Context: Working on concept:\n{concept_context}\n\nQuestion: {message}"
        
        # Generate response
        response_text = ""
        sources = []
        
        try:
            # Try to use RAG if we have a concept_id and vector store
            if concept_id and vector_store_service.vector_store:
                try:
                    try:
                        # Get retriever for this concept with enhanced error handling
                        retriever = vector_store_service.get_retriever(concept_id)
                    except Exception as retriever_error:
                        print(f"Error creating retriever: {retriever_error}")
                        # Fallback to simple LLM without retrieval
                        chain = self.chat_prompt | self.llm
                        response_text = chain.invoke({
                            "context": f"Unable to access documents for concept {concept_id} due to a technical error.",
                            "question": message,
                            "chat_history": chat_history_str
                        })
                        # Always use response_generator to clean and extract
                        return response_generator.create_response(response_text, [])
                except Exception as retriever_error:
                    print(f"Error creating retriever: {retriever_error}")
                    # Fallback to simple LLM response without retrieval
                    chain = self.chat_prompt | self.llm
                    response_text = chain.invoke({
                        "context": f"Unable to access documents for concept {concept_id} due to technical error.",
                        "question": message,
                        "chat_history": chat_history_str
                    })
                    return response_generator.create_response(response_text, [])

                if retriever:
                    # Create ConversationalRetrievalChain with our predefined prompts
                    from langchain.chains import LLMChain
                    from langchain.chains.question_answering import load_qa_chain

                    # Suppress deprecation warnings
                    with warnings.catch_warnings():
                        warnings.filterwarnings("ignore", category=DeprecationWarning)
                        # Create the question generator chain using our predefined prompt
                        question_generator = LLMChain(llm=self.llm, prompt=self.question_generator_prompt)
                        
                        # Create the QA chain for combining documents using our main chat prompt
                        doc_chain = load_qa_chain(llm=self.llm, chain_type="stuff", prompt=self.chat_prompt)

                    # Create the conversational chain with our custom components
                    conversation_chain = ConversationalRetrievalChain(
                        retriever=retriever,
                        combine_docs_chain=doc_chain,
                        question_generator=question_generator,
                        return_source_documents=True
                    )

                    print(f"Using {len(chat_history_tuples)} conversation pairs for retrieval chain")

                    # Check if we have any conversation pairs
                    # When there are 0 conversation pairs, the ConversationalRetrievalChain can fail
                    # To avoid this issue, use a direct LLM chain instead when there are no conversation pairs
                    if len(chat_history_tuples) == 0:
                        print("No conversation pairs available, using direct LLM chain instead of retrieval chain")
                        # Use direct LLM chain with the chat_prompt template
                        chain = self.chat_prompt | self.llm
                        response_text = chain.invoke({
                            "context": concept_context or "No specific context available.",
                            "question": enhanced_message,
                            "chat_history": chat_history_str
                        })
                        # Use response_generator to create the response
                        return response_generator.create_response(response_text, [])
                    
                    # Run the chain with the modern invoke method
                    result = conversation_chain.invoke({
                        "question": enhanced_message,  # Use enhanced message with concept context
                        "chat_history": chat_history_tuples,
                        "context": concept_context or "No specific context available."
                    })
                    response_text = result["answer"]

                    # Extract sources from retrieved documents
                    if "source_documents" in result:
                        for doc in result["source_documents"]:
                            sources.append({
                                "documentId": doc.metadata.get("document_id"),
                                "filename": doc.metadata.get("filename"),
                                "confidence": 0.9  # Placeholder
                            })
                    # Always use response_generator to clean and extract
                    return response_generator.create_response(response_text, sources)
                else:
                    # Fallback to simple LLM using our main chat prompt
                    print("No retriever available, using direct LLM chain")
                    chain = self.chat_prompt | self.llm
                    response_text = chain.invoke({
                        "context": concept_context or "No specific context available.",
                        "question": enhanced_message,
                        "chat_history": chat_history_str
                    })
                    return response_generator.create_response(response_text, [])
            else:
                # Use simple LLM chain with proper context
                print("Using direct LLM chain with structured JSON template")
                chain = self.chat_prompt | self.llm
                response_text = chain.invoke({
                    "context": concept_context or "No specific context available.",
                    "question": enhanced_message,
                    "chat_history": chat_history_str
                })
                # Always use response_generator to clean and extract
                return response_generator.create_response(response_text, [])
        except Exception as e:
            print(f"Error generating response: {e}")
            response_text = "I'm sorry, I encountered an error while processing your request. Please try again."
            return response_generator.create_response(response_text, [])

    def generate_welcome_message(self, init_request: InitializeChatForConceptRequest) -> str:
        """Generate a welcome message for a new concept"""
        return welcome_generator.generate_welcome_message(init_request)
        
    def _generate_dynamic_suggestions(self, concept_suggestion):
        """
        Delegate to response_generator for backward compatibility.
        
        Note: This method is maintained for backward compatibility with existing code.
        In the future, consider updating callers to use response_generator directly
        and remove this method once all callers have been updated.
        """
        return response_generator._generate_dynamic_suggestions(concept_suggestion)
        
    def _generate_dynamic_follow_up_questions(self, concept_suggestion):
        """
        Delegate to response_generator for backward compatibility.
        
        Note: This method is maintained for backward compatibility with existing code.
        In the future, consider updating callers to use response_generator directly
        and remove this method once all callers have been updated.
        """
        return response_generator._generate_dynamic_follow_up_questions(concept_suggestion)


# Create a singleton instance
llm_service = LLMService()

# Export the functions for use in controllers
def process_chat_request(chat_request: ChatRequest) -> ChatResponse:
    return llm_service.process_chat_request(chat_request)

def generate_welcome_message(init_request: InitializeChatForConceptRequest) -> str:
    return llm_service.generate_welcome_message(init_request)
