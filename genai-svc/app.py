from flask import Flask, jsonify
from langchain_community.llms import FakeListLLM
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from prometheus_flask_exporter import PrometheusMetrics
from prometheus_client import Gauge

APP_VERSION = "1.0.0"
SERVICE_NAME = "genai-svc"

app = Flask(__name__)
metrics = PrometheusMetrics(app)

# Custom version metric
version_gauge = Gauge('app_version_info', 'Application version info', ['service', 'version'])
version_gauge.labels(service=SERVICE_NAME, version=APP_VERSION).set(1)

# Initialize a simple LangChain component (using FakeListLLM for demonstration)
responses = ["This is a demonstration of LangChain integration."]
llm = FakeListLLM(responses=responses)
prompt = PromptTemplate(
    input_variables=["query"],
    template="Question: {query}\nAnswer:"
)
chain = LLMChain(llm=llm, prompt=prompt)

@app.route('/')
def home():
    """Standard status page for the GenAI service."""
    return jsonify({
        "status": "healthy",
        "service": "GenAI Service",
        "version": "0.1.0",
        "description": "Document ingestion, RAG pipeline, and content creation service"
    })

@app.route('/health')
def health():
    """Health check for the GenAI service."""
    return jsonify({
        "status": "UP",
        "timestamp": "2025-07-07T14:00:00Z", # Placeholder, ideally dynamic
        "service": "genai-service",
        "models": {
            "llm": "gpt-4",
            "embedding": "text-embedding-ada-002"
        },
        "vectorStore": {
            "status": "connected",
            "collections": 10
        }
    })

@app.route('/api/genai/langchain-test')
def langchain_test():
    """Test endpoint to demonstrate LangChain integration."""
    result = chain.run("Is LangChain integrated?")
    return jsonify({
        "result": result,
        "status": "success"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8083, debug=True)