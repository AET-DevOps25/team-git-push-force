import sys
from setuptools import setup, find_packages

NAME = "genai_models"
VERSION = "1.0.0"

# To install the library, run the following
#
# python setup.py install
#
# prerequisite: setuptools
# http://pypi.python.org/pypi/setuptools

REQUIRES = [
    "connexion>=2.0.2",
    "swagger-ui-bundle>=0.0.2",
    "python_dateutil>=2.6.0"
]

setup(
    name=NAME,
    version=VERSION,
    description="AI Event Concepter - GenAI Service",
    author_email="ge56jal@mytum.de",
    url="",
    keywords=["OpenAPI", "AI Event Concepter - GenAI Service"],
    install_requires=REQUIRES,
    packages=find_packages(),
    package_data={'': ['openapi/openapi.yaml']},
    include_package_data=True,
    entry_points={
        'console_scripts': ['genai_models=genai_models.__main__:main']},
    long_description="""\
    GenAI Service for the AI Event Concepter platform. Handles AI-powered content generation, document processing, RAG pipeline, and intelligent event concept development.  This service provides: - Document ingestion and processing (PDF, Word, text files) - RAG (Retrieval-Augmented Generation) pipeline using LangChain + Weaviate - Interactive chat interface for concept development - AI-powered content generation (themes, agendas, speaker suggestions) - Context-aware recommendations based on uploaded documents 
    """
)

