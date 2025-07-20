import os
import pytest
from unittest.mock import patch, MagicMock

# Import the OpenWebUILLM class
from openwebui_llm import OpenWebUILLM

class TestLLMIntegration:
    """Test suite for LLM integration with different prompts and scenarios."""

    def setup_method(self):
        """Set up test environment before each test method."""
        # Ensure environment variables are set for testing
        os.environ["SKIP_WEAVIATE"] = "true"
        os.environ["SKIP_MINIO"] = "true"
        os.environ["SKIP_OPENWEBUI"] = "true"
        
        # Get configuration from environment variables
        self.api_url = os.getenv("OPENWEBUI_API_URL", "https://example.com/api")
        self.api_token = os.getenv("OPENWEBUI_API_TOKEN", "test_token")
        self.model_name = os.getenv("OPENWEBUI_MODEL", "test_model")

    @patch('openwebui_llm.requests.post')
    def test_llm_with_event_planning_prompt(self, mock_post):
        """Test the LLM with an event planning prompt."""
        # Mock the response from the API
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": """I'd recommend a hybrid tech conference format for your AI innovation event. Here are some suggestions:

1. Start with a keynote from an industry leader
2. Include hands-on workshops for both in-person and virtual attendees
3. Set up networking sessions with breakout rooms for virtual participants

For the agenda, consider:
- Morning: Keynotes and presentations
- Afternoon: Parallel workshop tracks
- Evening: Networking reception

Would you like me to elaborate on any specific aspect of the event planning?"""
                    }
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Initialize the LLM
        llm = OpenWebUILLM(
            api_url=self.api_url,
            api_token=self.api_token,
            model_name=self.model_name
        )

        # Create an event planning prompt
        prompt = """I'm planning a tech conference focused on AI innovation. 
        What format would you recommend (virtual, in-person, or hybrid)? 
        And what should I include in the agenda?"""

        # Call the LLM
        result = llm(prompt)

        # Verify the result contains relevant information
        assert "hybrid" in result.lower()
        assert "agenda" in result.lower()
        assert "keynote" in result.lower()
        assert "workshop" in result.lower()
        
        # Verify the API was called with the correct parameters
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == f"{self.api_url}/chat/completions"
        assert kwargs['headers']['Authorization'] == f"Bearer {self.api_token}"
        assert kwargs['json']['model'] == self.model_name
        assert prompt in kwargs['json']['messages'][0]['content']

    @patch('openwebui_llm.requests.post')
    def test_llm_with_complex_event_requirements(self, mock_post):
        """Test the LLM with complex event requirements."""
        # Mock the response from the API
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": """For a 3-day international tech summit with 500 attendees, here's what I recommend:

Day 1: Opening ceremonies, keynote speakers, and broad industry trends
- 9:00 AM: Registration and welcome coffee
- 10:00 AM: Opening ceremony
- 11:00 AM: Keynote: "The Future of AI in Global Business"
- 12:30 PM: Networking lunch
- 2:00 PM: Panel discussion: "International Collaboration in Tech"
- 4:00 PM: Regional breakout sessions
- 6:00 PM: Welcome reception

Day 2: Deep dive technical sessions and workshops
- 9:00 AM: Morning keynote: "Technical Innovations Shaping Tomorrow"
- 10:30 AM: Parallel workshop tracks (AI, Blockchain, Cloud Computing)
- 12:30 PM: Lunch and poster sessions
- 2:00 PM: Hands-on labs and technical demonstrations
- 4:00 PM: Industry-specific roundtables
- 7:00 PM: Gala dinner with awards ceremony

Day 3: Business applications and closing
- 9:00 AM: Case studies from industry leaders
- 11:00 AM: Venture capital and startup showcase
- 12:30 PM: Networking lunch
- 2:00 PM: Future trends and opportunities panel
- 3:30 PM: Closing keynote: "Taking Innovation Forward"
- 5:00 PM: Farewell reception

For a budget of $200,000, I recommend allocating:
- Venue and equipment: $80,000
- Catering: $50,000
- Speaker fees and travel: $30,000
- Marketing and promotion: $20,000
- Staff and miscellaneous: $20,000

Would you like me to elaborate on any specific aspect of this plan?"""
                    }
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Initialize the LLM
        llm = OpenWebUILLM(
            api_url=self.api_url,
            api_token=self.api_token,
            model_name=self.model_name
        )

        # Create a complex event planning prompt
        prompt = """I need to organize a 3-day international tech summit for about 500 attendees.
        Can you provide a detailed agenda for all three days and suggest how I should allocate my $200,000 budget?"""

        # Call the LLM
        result = llm(prompt)

        # Verify the result contains relevant information
        assert "day 1" in result.lower()
        assert "day 2" in result.lower()
        assert "day 3" in result.lower()
        assert "budget" in result.lower()
        assert "$200,000" in result
        assert "venue" in result.lower()
        assert "catering" in result.lower()
        
        # Verify the API was called with the correct parameters
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == f"{self.api_url}/chat/completions"
        assert kwargs['headers']['Authorization'] == f"Bearer {self.api_token}"
        assert kwargs['json']['model'] == self.model_name
        assert "3-day" in kwargs['json']['messages'][0]['content']
        assert "500 attendees" in kwargs['json']['messages'][0]['content']
        assert "$200,000" in kwargs['json']['messages'][0]['content']

    @patch('openwebui_llm.requests.post')
    def test_llm_with_speaker_selection_prompt(self, mock_post):
        """Test the LLM with a speaker selection prompt."""
        # Mock the response from the API
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": """For a tech conference on AI and machine learning, I'd recommend the following types of speakers:

1. Industry Leaders:
   - Chief AI Officers from major tech companies
   - Founders of successful AI startups
   - Directors of AI research labs

2. Academic Experts:
   - Professors specializing in machine learning and AI ethics
   - Researchers from top universities working on cutting-edge AI applications
   - Authors of influential papers in the field

3. Practical Implementers:
   - Engineers who have deployed AI systems at scale
   - Data scientists with experience in real-world applications
   - Product managers who have brought AI products to market

4. Ethical and Policy Voices:
   - Experts in AI ethics and responsible innovation
   - Policy makers focused on AI regulation
   - Advocates for inclusive and accessible AI

5. Cross-industry Practitioners:
   - Healthcare professionals using AI for medical applications
   - Financial experts implementing AI in fintech
   - Manufacturing leaders applying AI to industrial processes

For a balanced program, I'd suggest:
- 2-3 high-profile keynote speakers (one per day)
- 8-10 industry leaders for main sessions
- 10-12 technical experts for specialized tracks
- 5-6 panel discussions with diverse participants

Would you like specific names of potential speakers in any of these categories?"""
                    }
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Initialize the LLM
        llm = OpenWebUILLM(
            api_url=self.api_url,
            api_token=self.api_token,
            model_name=self.model_name
        )

        # Create a speaker selection prompt
        prompt = """I'm organizing a tech conference focused on AI and machine learning.
        What types of speakers should I invite, and how many speakers would create a balanced program?"""

        # Call the LLM
        result = llm(prompt)

        # Verify the result contains relevant information
        assert "industry leaders" in result.lower()
        assert "academic" in result.lower()
        assert "keynote" in result.lower()
        assert "balanced" in result.lower()
        assert "panel" in result.lower()
        
        # Verify the API was called with the correct parameters
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == f"{self.api_url}/chat/completions"
        assert kwargs['headers']['Authorization'] == f"Bearer {self.api_token}"
        assert kwargs['json']['model'] == self.model_name
        assert "tech conference" in kwargs['json']['messages'][0]['content']
        assert "AI and machine learning" in kwargs['json']['messages'][0]['content']
        assert "speakers" in kwargs['json']['messages'][0]['content']
