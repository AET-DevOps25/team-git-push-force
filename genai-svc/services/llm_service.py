import os
import requests
import json
from typing import List, Dict, Any, Optional
from langchain.chains import LLMChain, ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain_community.llms.fake import FakeListLLM

from genai_models.models.chat_request import ChatRequest
from genai_models.models.chat_response import ChatResponse
from genai_models.models.initialize_chat_for_concept_request import InitializeChatForConceptRequest
from services.vector_store import vector_store_service

# Import custom OpenWebUI LLM
from openwebui_llm import OpenWebUILLM

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
                max_tokens=1024
            )
            print("Successfully initialized OpenWebUI LLM")
        except Exception as e:
            print(f"Warning: Could not initialize OpenWebUI LLM: {e}")
            print("Falling back to FakeListLLM")
            # Fall back to FakeListLLM if OpenWebUI is not available
            self.llm = FakeListLLM(
                responses=["This is a placeholder response from the FakeListLLM model."],
                temperature=0.7,
            )
        
        # Initialize prompt templates
        self.chat_prompt = PromptTemplate(
            input_variables=["context", "question", "chat_history"],
            template="""You are an AI assistant for event planning and concept development. 
            Use the following context to answer the question. If you don't know the answer, 
            just say that you don't know, don't try to make up an answer.

            Context: {context}

            Chat History: {chat_history}

            Question: {question}

            Answer:"""
        )
        
        self.welcome_prompt = PromptTemplate(
            input_variables=["user_name", "concept_name", "concept_description"],
            template="""You are an AI assistant for event planning and concept development.
            
            Generate a friendly welcome message for {user_name} who is creating a new event concept called "{concept_name}".
            
            The concept is described as: {concept_description}
            
            Your welcome message should be enthusiastic, mention the concept name and briefly comment on the concept description.
            Also offer to help with developing the concept further.
            
            Welcome message:"""
        )
    
    def process_chat_request(self, chat_request: ChatRequest) -> ChatResponse:
        """Process a chat request and generate a response"""
        # Extract message and context
        message = chat_request.message
        concept_id = chat_request.context.concept_id if chat_request.context else None
        
        # Get chat history
        chat_history = []
        if chat_request.context and chat_request.context.previous_messages:
            for msg in chat_request.context.previous_messages:
                chat_history.append((msg.user_message, msg.assistant_response))
        
        # Prepare enhanced message with concept info if available
        enhanced_message = message
        if concept_id:
            # In a real implementation, we would fetch concept details from the concept service
            # For now, we'll just use the concept_id
            enhanced_message = f"[Concept ID: {concept_id}] {message}"
        
        # Generate response
        response_text = ""
        sources = []
        
        try:
            # Try to use RAG if we have a concept_id and vector store
            if concept_id and vector_store_service.vector_store:
                # Get retriever for this concept
                retriever = vector_store_service.get_retriever(concept_id)
                
                if retriever:
                    # Create ConversationalRetrievalChain
                    conversation_chain = ConversationalRetrievalChain.from_llm(
                        llm=self.llm,
                        retriever=retriever,
                        return_source_documents=True
                    )
                    
                    # Run the chain
                    result = conversation_chain({"question": message, "chat_history": chat_history})
                    response_text = result["answer"]
                    
                    # Extract sources from retrieved documents
                    if "source_documents" in result:
                        for doc in result["source_documents"]:
                            sources.append({
                                "documentId": doc.metadata.get("document_id"),
                                "filename": doc.metadata.get("filename"),
                                "confidence": 0.9  # Placeholder
                            })
                else:
                    # Fallback to simple LLM
                    chain = LLMChain(llm=self.llm, prompt=self.chat_prompt)
                    response_text = chain.run(
                        context="No specific documents available for this concept.",
                        question=message,
                        chat_history=str(chat_history)
                    )
            else:
                # Use simple LLM chain
                chain = LLMChain(llm=self.llm, prompt=self.chat_prompt)
                response_text = chain.run(
                    context="No specific context available.",
                    question=message,
                    chat_history=str(chat_history)
                )
        except Exception as e:
            print(f"Error generating response: {e}")
            response_text = "I'm sorry, I encountered an error while processing your request. Please try again."
        
        # Generate follow-up suggestions
        suggestions = [
            "Tell me more about the event format",
            "What speakers would you recommend for this type of event?",
            "How can I make this event more engaging for the audience?"
        ]
        
        # Generate follow-up questions
        follow_up_questions = [
            "What is your target audience?",
            "What is your budget for this event?",
            "When are you planning to hold this event?"
        ]
        
        return ChatResponse(
            response=response_text,
            suggestions=suggestions,
            follow_up_questions=follow_up_questions,
            sources=sources,
            confidence=0.9,  # Placeholder
            tokens={
                "prompt": 100,  # Placeholder
                "response": 150,  # Placeholder
                "total": 250  # Placeholder
            }
        )
    
    def generate_welcome_message(self, init_request: InitializeChatForConceptRequest) -> str:
        """Generate a welcome message for a new concept"""
        try:
            # Extract information from the request
            user_name = init_request.user_id  # Using userId as user_name placeholder
            concept_name = init_request.concept_title
            concept_description = ""  # Not available in current API spec, providing empty string
            
            # Use the welcome prompt template
            chain = LLMChain(llm=self.llm, prompt=self.welcome_prompt)
            welcome_message = chain.run(
                user_name=user_name,
                concept_name=concept_name,
                concept_description=concept_description
            )
            
            return welcome_message
        except Exception as e:
            print(f"Error generating welcome message: {e}")
            # Fallback message using available data
            return f"Welcome, {init_request.user_id}! I'm here to help you develop your event concept '{init_request.concept_title}'. Let's get started!"

# Create a singleton instance
llm_service = LLMService()

# Export the functions for use in controllers
def process_chat_request(chat_request: ChatRequest) -> ChatResponse:
    return llm_service.process_chat_request(chat_request)

def generate_welcome_message(init_request: InitializeChatForConceptRequest) -> str:
    return llm_service.generate_welcome_message(init_request)