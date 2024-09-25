"""
The schema for the alphagrams should be here.

"""

import json
import logging

import jsonschema
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


LIST_SCHEMA = """
{
    "title": "Aerolith List Format",
    "$schema": "http://json-schema.org/schema#",
    "type": "array",
    "definitions": {
        "qaSet": {
            "type": "object",
            "properties": {
                "q": {"type": "string"},
                "a": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "minItems": 1
                }
            },
            "required": ["q", "a"],
            "additionalProperties": false
        },
        "probabilityRange": {
            "type": "integer"
        }
    },
    "oneOf": [{
        "items": {
            "$ref": "#/definitions/qaSet"
        },
        "minItems": 1,
        "maxItems": 200000
    }, {
        "items": {
            "$ref": "#/definitions/probabilityRange"
        },
        "minItems": 2,
        "maxItems": 2
    }]
}

"""


def validate(value, schema):
    try:
        data = json.loads(value)
    except (ValueError, TypeError):
        raise ValidationError("Invalid JSON in word list format.")
    try:
        jsonschema.validate(data, schema)
    except jsonschema.ValidationError as e:
        raise ValidationError(e)


def named_list_format_validator(value):
    schema = json.loads(LIST_SCHEMA)
    validate(value, schema)


def word_list_format_validator(value):
    """
    This schema is a little less permissive. Let's just update it on
    the fly so we don't have to version two nearly identical schemata.

    """
    schema = json.loads(LIST_SCHEMA)
    # Remove the "probabilityRange".
    schema["oneOf"].pop()
    validate(value, schema)
