const interactiveTags = [
        "a",
        "button",
        "input",
        "select",
        "textarea",
        "summary",
        "optgroup",
        "details",
        "option",
        "form",
];
const semanticTags = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "nav",
    "main",
    "header",
    "footer",
    "article",
    "section",
    "p",
    "span",
    "div",
    "ul",
    "ol",
    "li",
    "label",
    "img",
];
const importantEvents = [
    "click",
    "mousedown",
    "mouseup",
    "change", 
    "input",
    "keydown",
    "keyup",
    "keypress"
];
const interactiveRoles = [
    "button",
    "link",
    "menuitem",
    "option",
    "radio",
    "checkbox",
    "tab",
    "textbox",
    "combobox",
    "slider",
    "spinbutton",
    "listbox",
    "search",
    "searchbox",
];
const keyAttributes = [
    "id",
    "class",
    "name",
    "type",
    "href",
    "src",
    "placeholder",
    "aria-label",
    "aria-describedby",
    "value",
    "alt",
    "disabled",
    "required",
    "checked"
];

function isElementInteractive(el) {
    if (el.tagName.toLowerCase() in interactiveTags)
        return true;
    if (el.getAttribute("role") in interactiveRoles)
        return true;
    if (el.hasAttribute("hasInteractiveListener"))
        return true;
    if (el.tabIndex >= 0)
        return true;
    
    return false;
}

function isElementVisible(el) {
    if (!el) 
        return false;
    const style = window.getComputedStyle(el);
    return (
        style.display !== 'none' &&
        style.visibility === 'visible' &&
        style.opacity !== '0'
    );
}

function isElementCovered(el) {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const elAtPoint = document.elementFromPoint(centerX, centerY);
    return el.contains(elAtPoint);
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const viewWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= viewHeight &&
        rect.right <= viewWidth
    );
}

function getElementVisibilityStatus(el) {
    if (!isElementVisible(el))
        return "hidden";
    if (isElementInViewport(el))
        return "in_viewport_full";
    if (isElementPartiallyInViewport(el))
        return "in_viewport_partial";
    return "out_of_viewport"
};

function isElementPartiallyInViewport(el) {
    const rect = el.getBoundingClientRect();
    const viewWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;

    return (
        rect.left < viewWidth &&
        rect.right > 0 &&
        rect.top < viewHeight &&
        rect.bottom > 0
    );
}

class SelectorGenerator {
    constructor() {
        this.path = []
        this.idIndexes = [0]
        this.siblingCounters = [new Map()]
    }
    enter(node) {
        const tagName = node.tagName;
        let selector = tagName.toLowerCase();
        const currentLevel = this.siblingCounters[this.siblingCounters.length - 1];
        const count = (currentLevel.get(tagName) || 0) + 1;
        currentLevel.set(tagName, count);

        if (node.id) {
            selector += "#" + node.id;
            this.path.push(selector);
            this.idIndexes.push(this.path.length - 1);
            return;
        }

        selector += `:nth-of-type(${count})`;
        this.path.push(selector);

    }
    _getLastIdIndex() {
        return this.idIndexes[this.idIndexes.length - 1];
    }
    exit() {
        if (this._getLastIdIndex() == this.path.length - 1)
            this.idIndexes.pop();
        this.path.pop();
    }
    enterLevel() {
        this.siblingCounters.push(new Map());
    }
    exitLevel() {
        this.siblingCounters.pop();
    }
    getSelector() {
        return this.path.slice(this._getLastIdIndex()).join(" > ");
    }
}

function extractElementData(el) {
    const rect = el.getBoundingClientRect();
    const elementData = {
        "tag": el.tagName.toLowerCase(),
        "attributes": {
            "dataset": {}
        },
        "position": {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        },
        "visibility": getElementVisibilityStatus(el),
    }
    for (const key in el.dataset) {
        const value = el.dataset[key];
        elementData.attributes["dataset"][key] = value;
    }

    for (let attr of keyAttributes) {
        const value = el.getAttribute(attr);
        if (value !== null && value !== "") {
            elementData.attributes[attr] = value.trim();
        }
    }
    let text = "";
    for (let node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        }
    }
    text = text.trim();
    if (text.length > 0) {
        elementData["text"] = text;
    }
    return elementData
}

function hasImportantData(elementData) {
    const meaningfulAttributes = [
        "href",
        "src",
        "placeholder",
        "aria-label",
        "aria-describedby",
        "value",
        "alt",
    ];
    if ("text" in elementData)
        return true;
    for (let attr_name of meaningfulAttributes) {
        if (attr_name in elementData.attributes) 
            return true;
    }
    return false;
}

function traverse(node, selectorGen, depth=0, root=true, interactive_id=0) {
    selectorGen.enter(node);

    let elementData = extractElementData(node);
    elementData["depth"] = depth;
    elementData["selector"] = selectorGen.getSelector();
    let children = [];

    const interactive = isElementInteractive(node);
    const semantic = semanticTags.includes(elementData.tag);
    const worthKeeping = interactive || (semantic && hasImportantData(elementData)) || root;

    if (interactive)
        elementData["interactive_id"] = interactive_id;

    let interactiveCount = 0;
    interactiveCount += interactive;
    
    selectorGen.enterLevel();
    for (let child of node.children) {
        let [interactiveChildrenCount, childrenData] = traverse(
            child, 
            selectorGen, 
            depth + worthKeeping, 
            false, 
            interactive_id + interactiveCount
        );
        if (childrenData.length > 0) {
            interactiveCount += interactiveChildrenCount;
            children.push(...childrenData);
        }
    }
    selectorGen.exitLevel();
    if (children.length > 0) {
        elementData["children"] = children;
    }

    selectorGen.exit();
    if (worthKeeping)
        return [interactiveCount, [elementData]];
    return [interactiveCount, children];
}

window.getSimplifiedDOMInJSON = function() {
    let tree = traverse(document.body, new SelectorGenerator())[1];
    if (tree.length === 0) {
        return null;
    }
    return tree[0];
}
