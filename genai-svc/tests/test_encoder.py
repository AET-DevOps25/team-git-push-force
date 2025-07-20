import json
import sys
import os

# Add the genai-svc directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now we can import from genai_models
from genai_models.encoder import JSONEncoder
from genai_models.models.base_model import Model

# Create a simple test model hierarchy
class TestModelInner(Model):
    def __init__(self, inner_snake_case=None):
        self.openapi_types = {
            'inner_snake_case': str
        }
        self.attribute_map = {
            'inner_snake_case': 'innerCamelCase'
        }
        self._inner_snake_case = inner_snake_case

    @property
    def inner_snake_case(self):
        return self._inner_snake_case

    @inner_snake_case.setter
    def inner_snake_case(self, inner_snake_case):
        self._inner_snake_case = inner_snake_case

class TestModelOuter(Model):
    def __init__(self, outer_snake_case=None, nested_model=None, nested_list=None):
        self.openapi_types = {
            'outer_snake_case': str,
            'nested_model': TestModelInner,
            'nested_list': list
        }
        self.attribute_map = {
            'outer_snake_case': 'outerCamelCase',
            'nested_model': 'nestedModel',
            'nested_list': 'nestedList'
        }
        self._outer_snake_case = outer_snake_case
        self._nested_model = nested_model
        self._nested_list = nested_list

    @property
    def outer_snake_case(self):
        return self._outer_snake_case

    @outer_snake_case.setter
    def outer_snake_case(self, outer_snake_case):
        self._outer_snake_case = outer_snake_case

    @property
    def nested_model(self):
        return self._nested_model

    @nested_model.setter
    def nested_model(self, nested_model):
        self._nested_model = nested_model

    @property
    def nested_list(self):
        return self._nested_list

    @nested_list.setter
    def nested_list(self, nested_list):
        self._nested_list = nested_list

def test_encoder_recursive_serialization():
    """Test that the JSONEncoder correctly serializes nested model objects."""
    # Create a nested structure
    inner_model = TestModelInner(inner_snake_case="inner value")
    inner_model2 = TestModelInner(inner_snake_case="inner value 2")
    outer_model = TestModelOuter(
        outer_snake_case="outer value",
        nested_model=inner_model,
        nested_list=[inner_model2]
    )
    # Serialize the model using the custom encoder
    json_str = json.dumps(outer_model, cls=JSONEncoder)
    result = json.loads(json_str)
    # Print the result for debugging
    print(f"Serialized result: {json_str}")
    # Verify that the top-level properties are correctly serialized
    assert 'outerCamelCase' in result, "outerCamelCase property not found in result"
    assert 'outer_snake_case' not in result, "outer_snake_case property found in result (should be camelCase)"
    # Verify that nested model properties are correctly serialized
    assert 'nestedModel' in result, "nestedModel property not found in result"
    assert 'nested_model' not in result, "nested_model property found in result (should be camelCase)"
    
    nested_model_data = result['nestedModel']
    assert 'innerCamelCase' in nested_model_data, "innerCamelCase property not found in nestedModel"
    assert 'inner_snake_case' not in nested_model_data, "inner_snake_case property found in nestedModel (should be camelCase)"
    
    # Verify that nested list items are correctly serialized
    assert 'nestedList' in result, "nestedList property not found in result"
    assert 'nested_list' not in result, "nested_list property found in result (should be camelCase)"
    
    nested_list_data = result['nestedList']
    assert len(nested_list_data) == 1, "Expected 1 item in nestedList"
    assert 'innerCamelCase' in nested_list_data[0], "innerCamelCase property not found in nestedList item"
    assert 'inner_snake_case' not in nested_list_data[0], "inner_snake_case property found in nestedList item (should be camelCase)"
    
    print("All assertions passed! The JSONEncoder is correctly serializing nested model objects.")
