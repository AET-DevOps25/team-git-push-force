from langchain.prompts import PromptTemplate
from genai_models.models.initialize_chat_for_concept_request import InitializeChatForConceptRequest


class WelcomeGenerator:
    """Generates welcome messages for new chat sessions"""

    def __init__(self, llm):
        """Initialize the welcome generator with an LLM"""
        self.llm = llm
        self.welcome_prompt = PromptTemplate(
            input_variables=["user_name", "concept_name", "concept_description"],
            template="""You are an AI assistant for event planning and concept development.

            Generate a friendly welcome message for {user_name} who is creating a new event concept called "{concept_name}".

            The concept is described as: {concept_description}

            Your welcome message should be enthusiastic, mention the concept name and briefly comment on the concept description.
            Also offer to help with developing the concept further.

            Welcome message:"""
        )

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
welcome_generator = WelcomeGenerator(None)  # Will be initialized later with LLM