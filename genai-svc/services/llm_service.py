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
        # Use raw string to avoid issues with escape characters and indentation
        self.chat_prompt = PromptTemplate(
            input_variables=["context", "question", "chat_history"],
            template=r"""You are an AI assistant for event planning and concept development. 
            You have access to previous conversation history and context about the event concept being developed.

            Use the following context to answer the question. If you don't know the answer, 
            just say that you don't know, don't try to make up an answer.

            For EVERY response, please provide your answer in two parts:

            1. A conversational response to the user's question that acknowledges previous conversation context.

            2. A structured JSON object containing the concept details with the following format.
               HERE IS AN EXAMPLE OF A VALID RESPONSE FORMAT YOU MUST FOLLOW:

            "I understand you're looking for a tech conference with workshops on AI. That sounds like a great idea! I've developed an initial concept based on your requirements.

            ```json
            {{
              "title": "AI Innovation Summit",
              "eventDetails": {{
                "theme": "Future of AI in Business",
                "format": "HYBRID"
              }},
              "notes": "This is a concept for an AI-focused event with hands-on workshops"
            }}
            ```"

            Now, here is the JSON structure you should include:
            ```json
            {{
              "title": "Event Title",
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
                }},
                {{
                  "time": "10:30 AM",
                  "title": "Coffee Break",
                  "type": "BREAK",
                  "duration": 30
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

            IMPORTANT: YOU MUST INCLUDE THE JSON OBJECT IN EVERY RESPONSE, EXACTLY AS SHOWN ABOVE.
            The JSON object is REQUIRED for the application to work correctly.
            For simple questions or responses, include at least the title and notes fields in the JSON.
            Make sure the JSON is properly formatted and valid.

            Event Concept Context: {context}

            Previous Conversation:
            {chat_history}

            Current Question: {question}

            Answer:"""
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
            if hasattr(concept, 'eventDetails') and concept.eventDetails:
                if hasattr(concept.eventDetails, 'format') and concept.eventDetails.format:
                    concept_details.append(f"Format: {concept.eventDetails.format}")
                if hasattr(concept.eventDetails, 'targetAudience') and concept.eventDetails.targetAudience:
                    concept_details.append(f"Target Audience: {concept.eventDetails.targetAudience}")
                if hasattr(concept.eventDetails, 'theme') and concept.eventDetails.theme:
                    concept_details.append(f"Theme: {concept.eventDetails.theme}")
                if hasattr(concept.eventDetails, 'capacity') and concept.eventDetails.capacity:
                    concept_details.append(f"Capacity: {concept.eventDetails.capacity}")
                if hasattr(concept.eventDetails, 'duration') and concept.eventDetails.duration:
                    concept_details.append(f"Duration: {concept.eventDetails.duration}")
                if hasattr(concept.eventDetails, 'location') and concept.eventDetails.location:
                    concept_details.append(f"Location: {concept.eventDetails.location}")

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
                        # Extract concept suggestion from response text
                        concept_suggestion = concept_extractor.extract_concept_suggestion(response_text)
                        # Generate dynamic follow-up suggestions and questions
                        suggestions = response_generator._generate_dynamic_suggestions(concept_suggestion)
                        follow_up_questions = response_generator._generate_dynamic_follow_up_questions(concept_suggestion)
                        return ChatResponse(
                            response=response_text,
                            suggestions=suggestions,
                            follow_up_questions=follow_up_questions,
                            sources=[],
                            confidence=0.9,
                            concept_suggestion=concept_suggestion,
                            tokens={"prompt": 100, "response": 150, "total": 250}
                        )
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
                    # Create custom prompts that don't require a "title" variable
                    from langchain.prompts import PromptTemplate

                    # Create a custom prompt template for the question generator
                    # Use raw string to avoid issues with escape characters and indentation
                    custom_question_prompt = PromptTemplate(
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

                    # Create a custom prompt template for the QA chain
                    # Use raw string to avoid issues with escape characters and indentation
                    qa_prompt = PromptTemplate(
                        input_variables=["context", "question", "chat_history"],
                        template=r"""You are an AI assistant for event planning and concept development. 
                        Use the following pieces of context to answer the question at the end. If you don't know the answer, 
                        just say that you don't know, don't try to make up an answer.

                        For EVERY response, please provide your answer in two parts:

                        1. A conversational response to the user's question that acknowledges previous conversation context.

                        2. A structured JSON object containing the concept details as follows.
                           Here is an example of a properly formatted response:

                        "I understand you're looking for a tech conference. Based on your requirements, I've developed an initial concept.

                        ```json
                        {{
                          "title": "Tech Innovation Summit",
                          "eventDetails": {{
                            "theme": "Future of Technology",
                            "format": "HYBRID"
                          }},
                          "notes": "This is a concept for a technology event"
                        }}
                        ```"

                        Now, here is the JSON structure you should include:
                        ```json
                        {{
                          "title": "Event Title",
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
                            }},
                            {{
                              "time": "10:30 AM",
                              "title": "Coffee Break",
                              "type": "BREAK",
                              "duration": 30
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

                        Always include the JSON object in EVERY response, even if it's a partial suggestion or if you're just answering a question.
                        For simple questions or responses, include at least the title and notes fields in the JSON.
                        Make sure the JSON is properly formatted and valid.

                        Context:
                        {context}

                        Chat History:
                        {chat_history}

                        Question: {question}

                        Answer:"""
                    )

                    # Create ConversationalRetrievalChain with custom prompts
                    from langchain.chains import LLMChain
                    from langchain.chains.question_answering import load_qa_chain

                    # Create the question generator chain
                    # Use LLMChain but add a note that it's deprecated
                    # Note: This is still using LLMChain as the currently installed version of LangChain 
                    # doesn't support the newer pipe syntax yet
                    # Use the original LLMChain which is known to work with our codebase
                    from langchain.chains import LLMChain

                    # Suppress deprecation warnings
                    with warnings.catch_warnings():
                        warnings.filterwarnings("ignore", category=DeprecationWarning)
                        question_generator = LLMChain(llm=self.llm, prompt=custom_question_prompt)

                    # Create the QA chain for combining documents
                    # Note: Still using load_qa_chain as the installed version doesn't support create_stuff_documents_chain
                    # Will be updated in a future version
                    # Use the original load_qa_chain function which we know works
                    from langchain.chains.question_answering import load_qa_chain

                    # Suppress deprecation warnings
                    with warnings.catch_warnings():
                        warnings.filterwarnings("ignore", category=DeprecationWarning)
                        doc_chain = load_qa_chain(llm=self.llm, chain_type="stuff", prompt=qa_prompt)

                    # Create the conversational chain with our custom components
                    conversation_chain = ConversationalRetrievalChain(
                        retriever=retriever,
                        combine_docs_chain=doc_chain,
                        question_generator=question_generator,
                        return_source_documents=True
                    )

                    # Use the chat history tuples directly
                    print(f"Using {len(chat_history_tuples)} conversation pairs for retrieval chain")

                    # Check if we have any conversation pairs
                    # When there are 0 conversation pairs, the ConversationalRetrievalChain can fail with
                    # "Missing some input keys" error related to "title" fields with unusual formatting.
                    # To avoid this issue, we use a direct LLM chain instead when there are no conversation pairs.
                    if len(chat_history_tuples) == 0:
                        print("No conversation pairs available, using direct LLM chain instead of retrieval chain")
                        # Use direct LLM chain with the chat_prompt template
                        chain = self.chat_prompt | self.llm
                        response_text = chain.invoke({
                            "context": concept_context or "No specific context available.",
                            "question": enhanced_message,
                            "chat_history": chat_history_str
                        })
                        # Extract concept suggestion from response text
                        concept_suggestion = concept_extractor.extract_concept_suggestion(response_text)
                        # Generate dynamic follow-up suggestions and questions
                        suggestions = response_generator._generate_dynamic_suggestions(concept_suggestion)
                        follow_up_questions = response_generator._generate_dynamic_follow_up_questions(concept_suggestion)
                        return ChatResponse(
                            response=response_text,
                            suggestions=suggestions,
                            follow_up_questions=follow_up_questions,
                            sources=[],
                            confidence=0.9,
                            concept_suggestion=concept_suggestion,
                            tokens={"prompt": 100, "response": 150, "total": 250}
                        )
                    
                    # Run the chain with the modern invoke method
                    result = conversation_chain.invoke({
                        "question": enhanced_message,  # Use enhanced message with concept context
                        "chat_history": chat_history_tuples
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
                else:
                    # Fallback to simple LLM using RunnableSequence
                    chain = self.chat_prompt | self.llm
                    response_text = chain.invoke({
                        "context": "No specific documents available for this concept.",
                        "question": message,
                        "chat_history": chat_history_str
                    })
            else:
                # Use simple LLM chain with proper context
                print("Using direct LLM chain with structured JSON template")
                chain = self.chat_prompt | self.llm
                response_text = chain.invoke({
                    "context": concept_context or "No specific context available.",
                    "question": enhanced_message,
                    "chat_history": chat_history_str  # Use formatted string
                })

                # Log the response for debugging
                print(f"\n======= DIRECT LLM RESPONSE =======\n{response_text[:500]}...\n=================================")

                # Check if the response has a JSON structure
                import re
                json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
                if not json_match:
                    print("WARNING: No JSON structure found in response! Adding a default JSON structure.")
                    # Append a default JSON if none is found
                    default_json = '''
                ```json
                {
                  "title": "Event Concept",
                  "notes": "Generated from conversation"
                }
                ```'''
                    response_text = f"{response_text}\n\nHere's a summary of the concept:\n{default_json}"
                    print(f"Added default JSON structure to response")
                else:
                    print(f"JSON structure found in response")
        except Exception as e:
            print(f"Error generating response: {e}")
            response_text = "I'm sorry, I encountered an error while processing your request. Please try again."

        # Debug: print the response text before creating the response
        print(f"\n======= FINAL RESPONSE TEXT BEFORE PROCESSING =======\n{response_text[:500]}...\n=================================\n")

        # Check if response has the expected JSON format
        import re
        has_json_block = bool(re.search(r'```json\s*\{', response_text, re.DOTALL))
        if not has_json_block:
            print("WARNING: Response text does not contain properly formatted JSON block")
            # Add a fallback JSON block if necessary
            json_block = '''
        ```json
        {
          "title": "Event Concept",
          "eventDetails": {
            "theme": "Based on conversation",
            "format": "HYBRID"
          },
          "notes": "Generated from conversation context"
        }
        ```'''
            # Append JSON block to the response if not already present
            response_text = f"{response_text}\n\nHere's a summary of the concept:\n{json_block}"
            print("Added fallback JSON block to response")

        # Extract concept suggestion before passing to response generator
        concept_suggestion = concept_extractor.extract_concept_suggestion(response_text)

        # Create the response with all components
        generated_response = response_generator.create_response(response_text, sources)

        # Ensure the response has the concept suggestion
        if generated_response and not generated_response.concept_suggestion and concept_suggestion:
            generated_response.concept_suggestion = concept_suggestion
            print(f"Added missing concept_suggestion to response: {concept_suggestion.title}")

        return generated_response

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