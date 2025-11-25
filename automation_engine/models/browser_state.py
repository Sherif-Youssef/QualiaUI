from __future__ import annotations
from typing import Optional, Dict, List,Literal
from pydantic import BaseModel, Field


class DOMElement(BaseModel):
    interactive_id: Optional[int] = Field(default=None, description="ID for interactive element identification")
    tag: str = Field(description="HTML tag name")
    text: Optional[str] = Field(default=None, description="Visible text content")
    position: ElementPosition = Field(description="Element position")
    visibility: Literal["hidden", "in_viewport_full", "in_viewport_partial", "out_of_viewport"] = Field(description="Element visibility status")
    attributes: Dict[str, str | Dict[str, str]] = Field(default={}, description="Element attributes")
    selector: str = Field(description="Unique element selector")
    depth: int = Field(default=0, description="Visual hierarchy level")
    children: List[DOMElement] = Field(default=[], description="List of children elements")

    def to_json(self, indent: int = 4):
        return self.model_dump_json(indent=indent)

    def to_llm_string(
        self, 
        indent: int = 2,
        show_selector: bool = False,
        show_position: bool = False,
        verbosity: Literal["minimal", "standard", "full"] = "standard"
    ) -> str:
        """
        Optimized for LLM parsing with configurable detail level.
        
        Args:
            show_selector: Include CSS selectors
            show_position: Include position coordinates
            verbosity: 
                - "minimal": Only ID, tag, key attributes, text
                - "standard": + placeholder, aria-label, state flags
                - "full": + all attributes, position, dataset
        """
        lines = []
        
        def render(el: DOMElement, depth: int = 0) -> None:
            prefix = "  " * depth * indent
            parts = []
            secondary_info = []
            
            # 1. ID
            if el.interactive_id is not None:
                parts.append(f"[{el.interactive_id}]")
            
            # 2. Tag & visibility
            parts.append(el.tag)
            parts.append(f"({el.visibility})")
            
            # 3. Core identity attributes
            if el.attributes.get("id"):
                parts.append(f"id={el.attributes['id']}")
            if el.attributes.get("name"):
                parts.append(f"name={el.attributes['name']}")
            if el.attributes.get("type"):
                parts.append(f"type={el.attributes['type']}")
            
            # 4. Navigation attributes
            if el.attributes.get("href"):
                href = el.attributes['href']
                # Truncate long URLs
                if len(href) > 50:
                    parts.append(f"href={href[:47]}...")
                else:
                    parts.append(f"href={href}")
            
            if el.attributes.get("src"):
                src = el.attributes['src']
                if len(src) > 50:
                    parts.append(f"src={src[:47]}...")
                else:
                    parts.append(f"src={src}")
            
            # 5. State flags
            if el.attributes.get("disabled"):
                parts.append("DISABLED")
            if el.attributes.get("required"):
                parts.append("REQUIRED")
            if el.attributes.get("checked"):
                parts.append("CHECKED")
            
            # 6. Value
            if el.attributes.get("value"):
                value = el.attributes['value']
                if len(value) > 30:
                    parts.append(f'value="{value[:27]}..."')
                else:
                    parts.append(f'value="{value}"')
            
            # 7. Text content
            if el.text:
                text = el.text
                if len(text) > 2000:
                    parts.append(f'text="{text[:1997]}..."')
                else:
                    parts.append(f'text="{text}"')
            
            # === Standard and Full verbosity attributes ===
            
            if verbosity in ["standard", "full"]:
                # Placeholder
                if el.attributes.get("placeholder"):
                    placeholder = el.attributes['placeholder']
                    if len(placeholder) > 40:
                        secondary_info.append(f"placeholder=\"{placeholder[:37]}...\"")
                    else:
                        secondary_info.append(f"placeholder=\"{placeholder}\"")
                
                # Alt text
                if el.attributes.get("alt"):
                    alt = el.attributes['alt']
                    if len(alt) > 40:
                        secondary_info.append(f"alt=\"{alt[:37]}...\"")
                    else:
                        secondary_info.append(f"alt=\"{alt}\"")
                
                # Accessibility attributes
                if el.attributes.get("aria-label"):
                    aria_label = el.attributes['aria-label']
                    if len(aria_label) > 40:
                        secondary_info.append(f"aria-label=\"{aria_label[:37]}...\"")
                    else:
                        secondary_info.append(f"aria-label=\"{aria_label}\"")
                
                if el.attributes.get("aria-describedby"):
                    secondary_info.append(f"aria-describedby={el.attributes['aria-describedby']}")
            
            # === Full verbosity only ===
            
            if verbosity == "full":
                # Dataset attributes
                if el.attributes.get("dataset") and isinstance(el.attributes["dataset"], dict):
                    for key, value in el.attributes["dataset"].items():
                        if len(value) > 30:
                            secondary_info.append(f"data-{key}=\"{value[:27]}...\"")
                        else:
                            secondary_info.append(f"data-{key}=\"{value}\"")
                
                # Role attribute
                if el.attributes.get("role"):
                    secondary_info.append(f"role={el.attributes['role']}")
                
                # Class (can be noisy, so only in full mode)
                if el.attributes.get("class"):
                    classes = el.attributes['class']
                    if len(classes) > 40:
                        secondary_info.append(f"class=\"{classes[:37]}...\"")
                    else:
                        secondary_info.append(f"class=\"{classes}\"")
            
            # Position
            if show_position:
                pos = el.position
                # Abbreviated position format
                secondary_info.append(f"pos=({pos.x},{pos.y}) size={pos.width}x{pos.height}")
            
            # Selector
            if show_selector:
                selector = el.selector
                if len(selector) > 50:
                    secondary_info.append(f"selector={selector[:47]}...")
                else:
                    secondary_info.append(f"selector={selector}")
            
            # Write main line
            lines.append(f"{prefix}{' '.join(parts)}")
            
            # Write secondary info on indented sub-lines (if any)
            if secondary_info:
                sub_prefix = prefix + "  "
                for info in secondary_info:
                    lines.append(f"{sub_prefix}{info}")
            
            # Render children
            for child in el.children:
                render(child, depth + 1)
        
        render(self)
        return "\n".join(lines)

class ElementPosition(BaseModel):
    x: int = Field(description="X coordinate")
    y: int = Field(description="Y coordinate")
    width: int = Field(description="Element width")
    height: int = Field(description="Element height")
   
class BrowserState(BaseModel):
    current_url: str
    page_title: str = Field(default="")
    parent: DOMElement

    def to_llm_string(self) -> str:
        return f"""
            current_url: {self.current_url}
            page_title: {self.page_title}
            {self.parent.to_llm_string()}

        """