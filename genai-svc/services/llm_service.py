import os
import requests
import json
import re
import warnings
from typing import List, Dict, Any, Optional
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain_community.llms.fake import FakeListLLM
from langchain.schema.runnable import RunnablePassthrough

from genai_models.models.chat_request import ChatRequest
from genai_models.models.chat_response import ChatResponse
from genai_models.models.chat_response_concept_suggestion import ChatResponseConceptSuggestion
from genai_models.models.chat_response_concept_suggestion_event_details import ChatResponseConceptSuggestionEventDetails
from genai_models.models.chat_response_concept_suggestion_agenda_inner import ChatResponseConceptSuggestionAgendaInner
from genai_models.models.chat_response_concept_suggestion_speakers_inner import ChatResponseConceptSuggestionSpeakersInner
from genai_models.models.chat_response_concept_suggestion_pricing import ChatResponseConceptSuggestionPricing
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
            You have access to previous conversation history and context about the event concept being developed.

            Use the following context to answer the question. If you don't know the answer, 
            just say that you don't know, don't try to make up an answer.

            When suggesting event concepts, please provide your response in two parts:

            1. A conversational response to the user's question that acknowledges previous conversation context.

            2. A structured JSON object containing the concept details with the following format:
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

            Always include the JSON object when suggesting event concepts, even if it's a partial suggestion.
            Make sure the JSON is properly formatted and valid.

            Event Concept Context: {context}

            Previous Conversation:
            {chat_history}

            Current Question: {question}

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

    def extract_concept_suggestion(self, response_text: str) -> ChatResponseConceptSuggestion:
        """Extract concept suggestions from the response text"""
        # Initialize with default values
        title = "Event Concept Suggestion"
        description = response_text
        event_details = None
        agenda = []
        speakers = []
        pricing = None
        notes = ""
        reasoning = ""
        confidence = 0.9

        # Try to extract JSON from the response
        json_data = self._extract_json_from_text(response_text)

        if json_data:
            # Extract data from JSON
            if "title" in json_data:
                title = json_data["title"]

            # Extract event details
            if "eventDetails" in json_data:
                event_details_data = json_data["eventDetails"]
                event_details = ChatResponseConceptSuggestionEventDetails(
                    theme=event_details_data.get("theme"),
                    format=event_details_data.get("format", "").upper() if event_details_data.get("format") else None,
                    capacity=event_details_data.get("capacity"),
                    duration=event_details_data.get("duration"),
                    target_audience=event_details_data.get("targetAudience"),
                    location=event_details_data.get("location")
                )

            # Extract agenda
            if "agenda" in json_data and json_data["agenda"]:
                for agenda_item in json_data["agenda"]:
                    agenda.append(ChatResponseConceptSuggestionAgendaInner(
                        time=agenda_item.get("time", ""),
                        title=agenda_item.get("title", ""),
                        type=agenda_item.get("type", "KEYNOTE"),
                        duration=agenda_item.get("duration", 60)
                    ))

            # Extract speakers
            if "speakers" in json_data and json_data["speakers"]:
                for speaker in json_data["speakers"]:
                    speakers.append(ChatResponseConceptSuggestionSpeakersInner(
                        name=speaker.get("name", ""),
                        expertise=speaker.get("expertise", ""),
                        suggested_topic=speaker.get("suggestedTopic", "")
                    ))

            # Extract pricing
            if "pricing" in json_data:
                pricing_data = json_data["pricing"]
                pricing = ChatResponseConceptSuggestionPricing(
                    currency=pricing_data.get("currency", "USD"),
                    regular=pricing_data.get("regular"),
                    early_bird=pricing_data.get("earlyBird"),
                    vip=pricing_data.get("vip"),
                    student=pricing_data.get("student")
                )

            # Extract notes and reasoning
            if "notes" in json_data:
                notes = json_data["notes"]

            if "reasoning" in json_data:
                reasoning = json_data["reasoning"]
        else:
            # Fallback to legacy text parsing for backward compatibility with tests
            return self._extract_concept_suggestion_legacy(response_text)

        # Create and return the concept suggestion object
        return ChatResponseConceptSuggestion(
            title=title,
            description=description,
            event_details=event_details,
            agenda=agenda if agenda else None,
            speakers=speakers if speakers else None,
            pricing=pricing,
            notes=notes,
            reasoning=reasoning,
            confidence=confidence
        )

    def _extract_json_from_text(self, text: str) -> dict:
        """Extract JSON object from text"""
        # Look for JSON pattern in the text
        json_pattern = r'```json\s*(.*?)\s*```'
        json_match = re.search(json_pattern, text, re.DOTALL)

        if not json_match:
            # Try alternative pattern without the json tag
            json_pattern = r'```\s*(\{.*?\})\s*```'
            json_match = re.search(json_pattern, text, re.DOTALL)

        if not json_match:
            # Try to find JSON without code blocks
            # This pattern doesn't have a capturing group, so we need to handle it differently
            json_pattern = r'\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}'
            json_match = re.search(json_pattern, text, re.DOTALL)

        if json_match:
            try:
                # Parse the JSON
                if len(json_match.groups()) > 0:
                    # For patterns with capturing groups (first two patterns)
                    json_str = json_match.group(1)
                else:
                    # For pattern without capturing group (third pattern)
                    json_str = json_match.group(0)

                # Debug the extracted JSON string
                print(f"Extracted JSON string: {json_str[:100]}...")

                return json.loads(json_str)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON: {e}")
                # Try to clean up the JSON string and try again
                try:
                    # Remove any trailing commas before closing braces or brackets
                    json_str = re.sub(r',\s*}', '}', json_str)
                    json_str = re.sub(r',\s*]', ']', json_str)
                    return json.loads(json_str)
                except Exception:
                    print(f"Failed to parse JSON even after cleanup")
                    return {}
            except Exception as e:
                print(f"Unexpected error parsing JSON: {e}")
                return {}

        return {}

    def _extract_concept_suggestion_legacy(self, response_text: str) -> ChatResponseConceptSuggestion:
        """Legacy method to extract concept suggestions from text format (for backward compatibility)"""
        # Initialize with default values
        title = "Event Concept Suggestion"
        description = response_text
        event_details = None
        agenda = []
        speakers = []
        pricing = None
        notes = ""
        reasoning = ""
        confidence = 0.9

        # Extract title if it appears to be a specific event concept
        title_match = re.search(r'(?:^|\n|\s)Title:\s*"?([^"\n]+)"?', response_text, re.IGNORECASE)
        if title_match:
            title = title_match.group(1).strip()
            if title.lower().startswith("title:"):
                title = title[6:].strip()

        # Extract event details
        theme_match = re.search(r'(?:^|\n|\s)(?:Theme|Focus):\s*"?([^"\n]+)"?', response_text, re.IGNORECASE)
        format_match = re.search(r'(?:^|\n|\s)Format:\s*(PHYSICAL|VIRTUAL|HYBRID|physical|virtual|hybrid)', response_text, re.IGNORECASE)
        capacity_match = re.search(r'(?:^|\n|\s)(?:Capacity|Attendees):\s*(\d+)', response_text, re.IGNORECASE)
        duration_match = re.search(r'(?:^|\n|\s)Duration:\s*([^\n]+)', response_text, re.IGNORECASE)
        target_audience_match = re.search(r'(?:^|\n|\s)(?:Target Audience|Audience):\s*([^\n]+)', response_text, re.IGNORECASE)
        location_match = re.search(r'(?:^|\n|\s)Location:\s*([^\n]+)', response_text, re.IGNORECASE)

        # Create event details object if any matches found
        if any([theme_match, format_match, capacity_match, duration_match, target_audience_match, location_match]):
            event_details = ChatResponseConceptSuggestionEventDetails(
                theme=theme_match.group(1).strip() if theme_match else None,
                format=format_match.group(1).upper() if format_match else None,
                capacity=int(capacity_match.group(1)) if capacity_match else None,
                duration=duration_match.group(1).strip() if duration_match else None,
                target_audience=target_audience_match.group(1).strip() if target_audience_match else None,
                location=location_match.group(1).strip() if location_match else None
            )

        # Extract agenda items
        agenda_section_match = re.search(r'(?:^|\n|\s)Agenda:\s*\n(.*?)(?:\n\n|\n[A-Z]|\Z)', response_text, re.DOTALL | re.IGNORECASE)
        if agenda_section_match:
            agenda_text = agenda_section_match.group(1)
            agenda_pattern = r'(?:^|\n)(?:\*\*)?(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)\s*(?:-|–|:)\s*([^\n(]+)(?:\((\d+)(?:\s*min)?\))?'
            agenda_matches = re.finditer(agenda_pattern, agenda_text, re.MULTILINE)

            for match in agenda_matches:
                time = match.group(1).strip()
                title = match.group(2).strip()
                duration = int(match.group(3)) if match.group(3) else 60  # Default to 60 minutes

                # Determine type based on keywords
                session_type = "KEYNOTE"  # Default
                if any(keyword in title.lower() for keyword in ["workshop", "hands-on"]):
                    session_type = "WORKSHOP"
                elif any(keyword in title.lower() for keyword in ["panel", "discussion"]):
                    session_type = "PANEL"
                elif any(keyword in title.lower() for keyword in ["network", "social"]):
                    session_type = "NETWORKING"
                elif any(keyword in title.lower() for keyword in ["break", "coffee"]):
                    session_type = "BREAK"
                elif any(keyword in title.lower() for keyword in ["lunch", "dinner", "breakfast"]):
                    session_type = "LUNCH"

                agenda.append(ChatResponseConceptSuggestionAgendaInner(
                    time=time,
                    title=title,
                    type=session_type,
                    duration=duration
                ))

        # Extract speaker suggestions
        speakers_section_match = re.search(r'(?:^|\n|\s)Speakers:\s*\n(.*?)(?:\n\n|\n[A-Z]|\Z)', response_text, re.DOTALL | re.IGNORECASE)
        if speakers_section_match:
            speakers_text = speakers_section_match.group(1)
            speaker_pattern = r'(?:^|\n)(?:\*\*)?([A-Z][a-zA-Z\s.]+)(?:\*\*)?\s*(?:-|–|:)\s*([^\n]+)'
            speaker_matches = re.finditer(speaker_pattern, speakers_text, re.MULTILINE)

            for match in speaker_matches:
                name = match.group(1).strip()
                description = match.group(2).strip()

                # Skip if this doesn't look like a person's name
                if any(keyword in name.lower() for keyword in ["day", "session", "break", "lunch"]):
                    continue

                # Try to extract expertise and topic
                expertise = ""
                topic = ""

                if "(" in description and ")" in description:
                    parts = description.split("(")
                    if len(parts) > 1:
                        topic = parts[0].strip()
                        expertise = parts[1].split(")")[0].strip()
                else:
                    expertise = description

                speakers.append(ChatResponseConceptSuggestionSpeakersInner(
                    name=name,
                    expertise=expertise,
                    suggested_topic=topic
                ))

        # Extract pricing if present
        pricing_section_match = re.search(r'(?:^|\n|\s)Pricing:\s*\n(.*?)(?:\n\n|\n[A-Z]|\Z)', response_text, re.DOTALL | re.IGNORECASE)
        if pricing_section_match:
            pricing_text = pricing_section_match.group(1)
            currency_match = re.search(r'(?:^|\n|\s)(?:Currency|Price):\s*([A-Z]{3})', pricing_text, re.IGNORECASE)
            regular_match = re.search(r'(?:^|\n|\s)(?:Regular|Standard)(?:\s*Price)?:\s*(\d+)', pricing_text, re.IGNORECASE)
            early_bird_match = re.search(r'(?:^|\n|\s)Early Bird(?:\s*Price)?:\s*(\d+)', pricing_text, re.IGNORECASE)
            vip_match = re.search(r'(?:^|\n|\s)VIP(?:\s*Price)?:\s*(\d+)', pricing_text, re.IGNORECASE)
            student_match = re.search(r'(?:^|\n|\s)Student(?:\s*Price)?:\s*(\d+)', pricing_text, re.IGNORECASE)

            if any([currency_match, regular_match, early_bird_match, vip_match, student_match]):
                pricing = ChatResponseConceptSuggestionPricing(
                    currency=currency_match.group(1) if currency_match else "USD",
                    regular=float(regular_match.group(1)) if regular_match else None,
                    early_bird=float(early_bird_match.group(1)) if early_bird_match else None,
                    vip=float(vip_match.group(1)) if vip_match else None,
                    student=float(student_match.group(1)) if student_match else None
                )

        # Extract reasoning if present
        reasoning_match = re.search(r'(?:^|\n|\s)(?:Reasoning|Rationale):\s*(.*?)(?:\n\n|\n[A-Z]|\n\s*Notes:|\Z)', response_text, re.DOTALL | re.IGNORECASE)
        if reasoning_match:
            reasoning = reasoning_match.group(1).strip()

        # Extract notes if present
        notes_match = re.search(r'(?:^|\n|\s)(?:Notes|Additional Information):\s*(.*?)(?:\n\n|\n[A-Z]|\Z)', response_text, re.DOTALL | re.IGNORECASE)
        if notes_match:
            notes = notes_match.group(1).strip()


        return ChatResponseConceptSuggestion(
            title=title,
            description=description,
            event_details=event_details,
            agenda=agenda if agenda else None,
            speakers=speakers if speakers else None,
            pricing=pricing,
            notes=notes,
            reasoning=reasoning,
            confidence=confidence
        )

    def process_chat_request(self, chat_request: ChatRequest) -> ChatResponse:
        """Process a chat request and generate a response"""
        # Extract message and context
        message = chat_request.message
        concept = chat_request.concept
        concept_id = concept.id if concept else None

        # Get chat history - format it properly for the prompt
        chat_history = ""
        if hasattr(chat_request, 'context') and chat_request.context and hasattr(chat_request.context, 'previous_messages') and chat_request.context.previous_messages:
            print(f"Found {len(chat_request.context.previous_messages)} previous messages in conversation history")
            chat_history_lines = []
            for msg in chat_request.context.previous_messages:
                if hasattr(msg, 'user_message') and msg.user_message:
                    chat_history_lines.append(f"User: {msg.user_message}")
                if hasattr(msg, 'assistant_response') and msg.assistant_response:
                    chat_history_lines.append(f"Assistant: {msg.assistant_response}")
            chat_history = "\n".join(chat_history_lines)
        else:
            print("No previous conversation history found in request")

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
                                "chat_history": str(chat_history)
                            })
                            # Extract concept suggestion from response text
                            concept_suggestion = self.extract_concept_suggestion(response_text)
                            # Generate dynamic follow-up suggestions and questions
                            suggestions = self._generate_dynamic_suggestions(concept_suggestion)
                            follow_up_questions = self._generate_dynamic_follow_up_questions(concept_suggestion)
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
                        "chat_history": str(chat_history)
                    })
                    return self._create_response(response_text, [])

                if retriever:
                    # Create custom prompts that don't require a "title" variable
                    from langchain.prompts import PromptTemplate

                    # Create a custom prompt template for the question generator
                    custom_question_prompt = PromptTemplate(
                        input_variables=["chat_history", "question"],
                        template="""Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

                        Chat History:
                        {chat_history}

                        Follow Up Input: {question}

                        Standalone question:"""
                    )

                    # Create a custom prompt template for the QA chain
                    qa_prompt = PromptTemplate(
                        input_variables=["context", "question", "chat_history"],
                        template="""You are an AI assistant for event planning and concept development. 
                        Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.

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

                    # Format chat history properly
                    formatted_chat_history = []
                    for entry in chat_history:
                        if isinstance(entry, tuple) and len(entry) == 2:
                            # Convert tuple to proper format (user, ai)
                            formatted_chat_history.append((entry[0], entry[1]))

                    # Run the chain with the modern invoke method
                    result = conversation_chain.invoke({
                        "question": enhanced_message,  # Use enhanced message with concept context
                        "chat_history": [(entry[0], entry[1]) for entry in chat_history if isinstance(entry, tuple)]
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
                        "chat_history": str(chat_history)
                    })
            else:
                # Use simple LLM chain with proper context
                chain = self.chat_prompt | self.llm
                response_text = chain.invoke({
                    "context": concept_context or "No specific context available.",
                    "question": enhanced_message,
                    "chat_history": chat_history  # Use formatted string
                })
        except Exception as e:
            print(f"Error generating response: {e}")
            response_text = "I'm sorry, I encountered an error while processing your request. Please try again."

        # Use the helper method to create the response
        return self._create_response(response_text, sources)

    def _generate_dynamic_suggestions(self, concept_suggestion: ChatResponseConceptSuggestion) -> List[str]:
        """Generate dynamic suggestions based on the concept suggestion"""
        suggestions = []

        # Add suggestions based on what's missing or could be expanded
        if not concept_suggestion.agenda:
            suggestions.append("Can you suggest an agenda for this event?")
        else:
            suggestions.append("Can you refine the agenda with more detailed sessions?")

        if not concept_suggestion.speakers:
            suggestions.append("Who would be good speakers for this event?")
        else:
            suggestions.append("Can you suggest additional speakers with expertise in this field?")

        if not concept_suggestion.pricing:
            suggestions.append("What pricing structure would work for this event?")
        else:
            suggestions.append("How can I optimize the pricing strategy for maximum attendance?")

        # Add general suggestions
        general_suggestions = [
            "How can I make this event more interactive?",
            "What technologies should we use for this event?",
            "How can we promote this event effectively?",
            "What are the key success metrics for this type of event?",
            "How can we incorporate networking opportunities?",
            "What sponsorship opportunities would be appropriate?",
            "How should we handle registration and check-in?",
            "What post-event activities would you recommend?"
        ]

        # Add some general suggestions to ensure we have enough
        while len(suggestions) < 3 and general_suggestions:
            suggestions.append(general_suggestions.pop(0))

        # Limit to 3 suggestions
        return suggestions[:3]

    def _create_response(self, response_text: str, sources: List[Dict] = None) -> ChatResponse:
        """Create a standard ChatResponse object with concept suggestions and follow-up items"""
        if sources is None:
            sources = []

        # Extract concept suggestion from response text
        concept_suggestion = self.extract_concept_suggestion(response_text)

        # Generate dynamic follow-up suggestions and questions
        suggestions = self._generate_dynamic_suggestions(concept_suggestion)
        follow_up_questions = self._generate_dynamic_follow_up_questions(concept_suggestion)

        return ChatResponse(
            response=response_text,
            suggestions=suggestions,
            follow_up_questions=follow_up_questions,
            sources=sources,
            confidence=0.9,  # Placeholder
            concept_suggestion=concept_suggestion,
            tokens={
                "prompt": 100,  # Placeholder
                "response": 150,  # Placeholder
                "total": 250  # Placeholder
            }
        )

    def _generate_dynamic_follow_up_questions(self, concept_suggestion: ChatResponseConceptSuggestion) -> List[str]:
        """Generate dynamic follow-up questions based on the concept suggestion"""
        questions = []

        # Add questions based on what's missing or could be expanded
        if not concept_suggestion.event_details or not concept_suggestion.event_details.target_audience:
            questions.append("Who is the target audience for this event?")

        if not concept_suggestion.event_details or not concept_suggestion.event_details.duration:
            questions.append("How long should this event be?")

        if not concept_suggestion.event_details or not concept_suggestion.event_details.location:
            questions.append("Where would be an ideal location for this event?")

        # Add general questions
        general_questions = [
            "What is your budget for this event?",
            "When are you planning to hold this event?",
            "What are your main objectives for this event?",
            "Are there any specific themes or topics you want to focus on?",
            "Do you have any preferred speakers in mind?",
            "What has worked well for similar events in the past?",
            "What challenges do you anticipate for this event?",
            "How will you measure the success of this event?"
        ]

        # Add some general questions to ensure we have enough
        while len(questions) < 3 and general_questions:
            questions.append(general_questions.pop(0))

        # Limit to 3 questions
        return questions[:3]


    def generate_welcome_message(self, init_request: InitializeChatForConceptRequest) -> str:
        """Generate a welcome message for a new concept"""
        try:
            # Extract information from the request
            user_name = init_request.user_id  # Using userId as user_name placeholder
            concept_name = init_request.concept_title
            concept_description = ""  # Not available in current API spec, providing empty string

            # Use the welcome prompt template with RunnableSequence
            chain = self.welcome_prompt | self.llm
            welcome_message = chain.invoke({
                "user_name": user_name,
                "concept_name": concept_name,
                "concept_description": concept_description
            })

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
