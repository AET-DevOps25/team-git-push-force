import sys
import os
import json
from unittest import TestCase, main

# Add the parent directory to the path so we can import the modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from genai_models.encoder import JSONEncoder
from genai_models.models.base_model import Model

# Create simple test model classes
class TestNestedModel(Model):
    def __init__(self, value=None):
        self.openapi_types = {
            'value': str
        }
        self.attribute_map = {
            'value': 'value'
        }
        self._value = value

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self._value = value

class TestListModel(Model):
    def __init__(self, items=None):
        self.openapi_types = {
            'items': list
        }
        self.attribute_map = {
            'items': 'items'
        }
        self._items = items

    @property
    def items(self):
        return self._items

    @items.setter
    def items(self, items):
        self._items = items

class TestDictModel(Model):
    def __init__(self, data=None):
        self.openapi_types = {
            'data': dict
        }
        self.attribute_map = {
            'data': 'data'
        }
        self._data = data

    @property
    def data(self):
        return self._data

    @data.setter
    def data(self, data):
        self._data = data

class TestParentModel(Model):
    def __init__(self, nested=None, list_of_models=None, dict_of_models=None, simple_value=None):
        self.openapi_types = {
            'nested': TestNestedModel,
            'list_of_models': list,
            'dict_of_models': dict,
            'simple_value': str
        }
        self.attribute_map = {
            'nested': 'nested',
            'list_of_models': 'listOfModels',
            'dict_of_models': 'dictOfModels',
            'simple_value': 'simpleValue'
        }
        self._nested = nested
        self._list_of_models = list_of_models
        self._dict_of_models = dict_of_models
        self._simple_value = simple_value

    @property
    def nested(self):
        return self._nested

    @nested.setter
    def nested(self, nested):
        self._nested = nested

    @property
    def list_of_models(self):
        return self._list_of_models

    @list_of_models.setter
    def list_of_models(self, list_of_models):
        self._list_of_models = list_of_models

    @property
    def dict_of_models(self):
        return self._dict_of_models

    @dict_of_models.setter
    def dict_of_models(self, dict_of_models):
        self._dict_of_models = dict_of_models

    @property
    def simple_value(self):
        return self._simple_value

    @simple_value.setter
    def simple_value(self, simple_value):
        self._simple_value = simple_value

class TestEncoder(TestCase):
    def setUp(self):
        self.encoder = JSONEncoder()

    def test_encode_nested_model(self):
        # Create a nested model
        nested = TestNestedModel(value="test value")
        parent = TestParentModel(nested=nested, simple_value="parent value")

        # Encode the model
        encoded = self.encoder.encode(parent)
        decoded = json.loads(encoded)

        # Check that the nested model was properly encoded
        self.assertEqual(decoded['nested']['value'], "test value")
        self.assertEqual(decoded['simpleValue'], "parent value")

    def test_encode_list_of_models(self):
        # Create a list of models
        models = [TestNestedModel(value=f"test {i}") for i in range(3)]
        parent = TestParentModel(list_of_models=models)

        # Encode the model
        encoded = self.encoder.encode(parent)
        decoded = json.loads(encoded)

        # Check that the list of models was properly encoded
        self.assertEqual(len(decoded['listOfModels']), 3)
        self.assertEqual(decoded['listOfModels'][0]['value'], "test 0")
        self.assertEqual(decoded['listOfModels'][1]['value'], "test 1")
        self.assertEqual(decoded['listOfModels'][2]['value'], "test 2")

    def test_encode_dict_of_models(self):
        # Create a dict of models
        models = {
            'a': TestNestedModel(value="test a"),
            'b': TestNestedModel(value="test b")
        }
        parent = TestParentModel(dict_of_models=models)

        # Encode the model
        encoded = self.encoder.encode(parent)
        decoded = json.loads(encoded)

        # Check that the dict of models was properly encoded
        self.assertEqual(decoded['dictOfModels']['a']['value'], "test a")
        self.assertEqual(decoded['dictOfModels']['b']['value'], "test b")

    def test_encode_complex_model(self):
        # Create a complex model with nested models, lists, and dicts
        nested = TestNestedModel(value="nested value")
        list_models = [TestNestedModel(value=f"list item {i}") for i in range(2)]
        dict_models = {
            'x': TestNestedModel(value="dict value x"),
            'y': TestNestedModel(value="dict value y")
        }
        parent = TestParentModel(
            nested=nested,
            list_of_models=list_models,
            dict_of_models=dict_models,
            simple_value="parent value"
        )

        # Encode the model
        encoded = self.encoder.encode(parent)
        decoded = json.loads(encoded)

        # Check that all parts of the complex model were properly encoded
        self.assertEqual(decoded['nested']['value'], "nested value")
        self.assertEqual(decoded['listOfModels'][0]['value'], "list item 0")
        self.assertEqual(decoded['listOfModels'][1]['value'], "list item 1")
        self.assertEqual(decoded['dictOfModels']['x']['value'], "dict value x")
        self.assertEqual(decoded['dictOfModels']['y']['value'], "dict value y")
        self.assertEqual(decoded['simpleValue'], "parent value")

if __name__ == '__main__':
    main()
