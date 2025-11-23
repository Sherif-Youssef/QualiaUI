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

function isInteractive(el) {
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

function isFullyVisible(el) {
    const style = getComputedStyle(el);
    if (style.visibility !== "visible")
        return false;
    if (style.display === "none")
        return false;
    // const rect = el.getBoundingClientRect();
    // if (rect.width === 0 || rect.height === 0)
        // return false;
    
    return true;

    // const cx = rect.left + rect.width / 2;
    // const cy = rect.top + rect.height / 2;
    // const top = document.elementFromPoint(cx, cy);
    // return top === el || el.contains(top);
}

function getUniqueSelector(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) 
        return "";
    const path = [];
    while (node && node.nodeType === Node.ELEMENT_NODE) {
        let selector = node.nodeName.toLowerCase();
        if (node.id) {
            selector += "#" + node.id;
            path.unshift(selector);
            break;
        }
        let siblingIndex = 1;
        let sibling = node;
        while ((sibling = sibling.previousElementSibling)) {
            if (sibling.nodeName === node.nodeName) siblingIndex++;
        }
        selector += `:nth-of-type(${siblingIndex})`;
        path.unshift(selector);
        node = node.parentElement;
    }
    return path.join(" > ");
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
        "selector": getUniqueSelector(el),
    }
    for (const key in el.dataset) {
        const value = el.dataset[key];
        elementData.attributes["dataset"][key] = value;
    }

    for (let attr of keyAttributes) {
        const value = el.getAttribute(attr);
        if (value !== null && value !== "") {
            elementData.attributes[attr] = value.trim().substring(0, 25);
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
        elementData["text"] = text.substring(0, 200);
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

function traverse(node, depth=0, root=true, interactive_id=0) {
    if (!isFullyVisible(node))
        return [0, []];

    let elementData = extractElementData(node);
    elementData["depth"] = depth;
    let children = [];

    const interactive = isInteractive(node);
    const semantic = semanticTags.includes(elementData.tag);
    const worthKeeping = interactive || (semantic && hasImportantData(elementData)) || root;

    if (interactive)
        elementData["interactive_id"] = interactive_id;

    let interactiveCount = 0;
    interactiveCount += interactive;

    for (let child of node.children) {
        let [interactiveChildrenCount, childrenData] = traverse(child, depth + worthKeeping, false, interactive_id + interactiveCount);
        if (childrenData.length > 0) {
            interactiveCount += interactiveChildrenCount;
            children.push(...childrenData);
        }
    }
    if (children.length > 0) {
        elementData["children"] = children;
    }
    if (worthKeeping)
        return [interactiveCount, [elementData]];
    return [interactiveCount, children];
}

function getSimplifiedDOMInJSON() {
    let tree = traverse(document.body)[1];
    if (tree.length === 0) {
        return null;
    }
    return JSON.stringify(tree[0]);
}
