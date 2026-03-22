from typing import Type, Any
from pydantic import BaseModel

def schema_to_string(schema: dict[str, Any], refs: dict[str, Any], indent: int = 0) -> str:
    if "properties" in schema:
        properties = schema.get("properties")     
        base_indent_str = "  " * indent
        inner_indent_str = "  " * (indent + 1)
        
        lines = ["{"]
        prop_items = list(properties.items())
        
        for i, (key, prop_schema) in enumerate(prop_items):
            prop_val = schema_to_string(prop_schema, refs, indent + 2)
            
            comment = []
            if "description" in prop_schema:
                comment.append(f"description: {prop_schema['description']}")
            if "examples" in prop_schema:
                comment.append(f"examples: {prop_schema['examples']}")
            
            comment_str = ""
            if comment:
                comment_str = " // " + ", ".join(comment)

            comma = "," if i < len(prop_items) - 1 else ""
            lines.append(f'{inner_indent_str}"{key}": {prop_val}{comma}{comment_str}')
            
        lines.append(f"{base_indent_str}" + "}")
        return "\n".join(lines)

    # fields
    if "$ref" in schema:
        ref_key = schema["$ref"].replace("#/$defs/", "")
        return schema_to_string(refs[ref_key], refs, indent)

    if "enum" in schema:
        return " | ".join(f'"{x}"' for x in schema["enum"])
    
    if "const" in schema:
        return f'"{schema["const"]}"'
    
    type_ = schema.get("type")
    
    if isinstance(type_, list):
        return " | ".join(type_)
    
    if type_ == "array":
        items = schema.get("items", {})
        return f"{schema_to_string(items, refs, indent)}[]"

    return type_

def model_to_string(model: Type[BaseModel]) -> str:
    json_schema = model.model_json_schema(union_format='primitive_type_array')
    refs = json_schema.get("$defs", {})
    return schema_to_string(json_schema, refs)
