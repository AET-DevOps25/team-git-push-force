"""
Serialization utilities for converting model objects to dictionaries and JSON.

This module provides functions for serializing model objects in a way that
ensures consistent naming conventions between the backend and frontend.
"""

import json
from genai_models.encoder import JSONEncoder
from genai_models.models.base_model import Model

# Create an instance of our custom JSONEncoder
encoder = JSONEncoder()

def to_camel_case_dict(obj):
    """
    Convert a model object to a dictionary with camelCase keys.
    
    This function uses our custom JSONEncoder to ensure that snake_case attribute
    names in Python are properly converted to camelCase keys in the resulting
    dictionary, according to the attribute_map defined in the model.
    
    Args:
        obj: A model object or any other object that can be serialized to JSON.
        
    Returns:
        dict: A dictionary representation of the object with camelCase keys.
    """
    if isinstance(obj, Model):
        # Use our custom JSONEncoder to serialize the model
        # This ensures that attribute_map is used for key conversion
        return encoder.default(obj)
    elif hasattr(obj, 'to_dict'):
        # For other objects with to_dict method, use it and hope for the best
        return obj.to_dict()
    else:
        # For primitive types, just return as is
        return obj
