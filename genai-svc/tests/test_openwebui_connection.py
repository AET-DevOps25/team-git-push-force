import os
import pytest
from dotenv import load_dotenv

# Import the OpenWebUILLM class
from openwebui_llm import OpenWebUILLM

@pytest.mark.skipif(os.getenv("SKIP_OPENWEBUI", "false").lower() == "true",
                   reason="Skipping OpenWebUI connection test when SKIP_OPENWEBUI is true")
def test_openwebui_connection():
    # Load environment variables from .env
    load_dotenv()

    # Get OpenWebUI configuration from environment variables
    api_url = os.getenv("OPENWEBUI_API_URL")
    api_token = os.getenv("OPENWEBUI_API_TOKEN")
    model_name = os.getenv("OPENWEBUI_MODEL")

    print(f"Testing connection to OpenWebUI API at {api_url}")
    print(f"Using model: {model_name}")

    try:
        # Initialize the OpenWebUILLM
        llm = OpenWebUILLM(
            api_url=api_url,
            api_token=api_token,
            model_name=model_name,
            temperature=0.7,
            max_tokens=100
        )

        # Make a simple query
        prompt = "Hello, can you hear me? Please respond with a short message to confirm the connection is working."
        print("\nSending test prompt to OpenWebUI API...")
        response = llm(prompt)

        print("\nResponse from OpenWebUI API:")
        print(response)

        print("\n✅ Connection test successful! The OpenWebUI API is working correctly.")
        return True
    except Exception as e:
        print(f"\n❌ Connection test failed: {str(e)}")
        print("\nPlease check your .env file and make sure:")
        print("1. OPENWEBUI_API_URL is correct (currently: {})".format(api_url))
        print("2. OPENWEBUI_API_TOKEN is valid (currently: {})".format(api_token[:5] + "..." if api_token else "Not set"))
        print("3. OPENWEBUI_MODEL is available (currently: {})".format(model_name))
        print("4. The OpenWebUI server is running and accessible from your network")
        return False
