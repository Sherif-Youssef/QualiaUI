import { KEY_ATTRIBUTES, MEANINGFUL_ATTRIBUTES } from './constants.js';

export class ElementDataExtractor {
    constructor(validator) {
        this.validator = validator;
        this.keyAttributes = KEY_ATTRIBUTES;
        this.meaningfulAttributes = MEANINGFUL_ATTRIBUTES;
    }

    extract(element) {
        const rect = element.getBoundingClientRect();
        const elementData = {
            tag: element.tagName.toLowerCase(),
            attributes: {
                dataset: {}
            },
            position: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            },
            visibility: this.validator.getVisibilityStatus(element)
        };

        // Extract dataset
        for (const key in element.dataset) {
            elementData.attributes.dataset[key] = element.dataset[key];
        }

        // Extract key attributes
        for (const attr of this.keyAttributes) {
            const value = this._getPropOrAttr(element, attr);
            if (value !== null && value !== "") {
                elementData.attributes[attr] =
                    typeof value === "string" ? value.trim() : value;
            }
        }

        // Extract direct text content
        const text = this._extractDirectText(element);
        if (text.length > 0) {
            elementData.text = text;
        }

        return elementData;
    }

    hasImportantData(elementData) {
        if ("text" in elementData) return true;
        
        for (const attrName of this.meaningfulAttributes) {
            if (attrName in elementData.attributes) return true;
        }
        
        return false;
    }

    _getPropOrAttr(element, name, defaultValue = null) {
        if (name in element) {
            return element[name] ?? defaultValue;
        }
        return element.getAttribute(name) ?? defaultValue;
    }

    _extractDirectText(element) {
        let text = "";
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent + " ";
            }
        }
        return text.trim();
    }
}