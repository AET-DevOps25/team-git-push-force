from flask import Flask, jsonify
from langchain_community.llms import FakeListLLM
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

app = Flask(__name__)

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

@app.route('/api/langchain-test')
def langchain_test():
    """Test endpoint to demonstrate LangChain integration."""
    result = chain.run("Is LangChain integrated?")
    return jsonify({
        "result": result,
        "status": "success"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8083, debug=True)
