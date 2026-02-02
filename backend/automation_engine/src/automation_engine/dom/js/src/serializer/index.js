import { DOMTraverser } from './dom_traverser.js';

// Main function that gets injected into the page
window.getSimplifiedDOMInJSON = function() {
    const traverser = new DOMTraverser();
    return traverser.getSimplifiedDOM();
};