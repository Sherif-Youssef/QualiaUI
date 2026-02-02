import { INTERACTIVE_TAGS, INTERACTIVE_ROLES, SEMANTIC_TAGS } from './constants.js';

export class ElementValidator {
    constructor() {
        this.interactiveTags = new Set(INTERACTIVE_TAGS);
        this.interactiveRoles = new Set(INTERACTIVE_ROLES);
        this.semanticTags = new Set(SEMANTIC_TAGS);
    }

    isInteractive(element) {
        const tagName = element.tagName.toLowerCase();
        const role = element.getAttribute("role");
        
        if (this.interactiveTags.has(tagName)) return true;
        if (role && this.interactiveRoles.has(role)) return true;
        if (element.hasAttribute("hasInteractiveListener")) return true;
        if (element.tabIndex >= 0) return true;
        
        return false;
    }

    isSemantic(element) {
        const tagName = element.tagName.toLowerCase();
        return this.semanticTags.has(tagName);
    }

    isVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
            style.display !== 'none' &&
            style.visibility === 'visible' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0
        );
    }

    isCovered(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const elAtPoint = document.elementFromPoint(centerX, centerY);
        return element.contains(elAtPoint);
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        const viewWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= viewHeight &&
            rect.right <= viewWidth
        );
    }

    isPartiallyInViewport(element) {
        const rect = element.getBoundingClientRect();
        const viewWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;

        return (
            rect.left < viewWidth &&
            rect.right > 0 &&
            rect.top < viewHeight &&
            rect.bottom > 0
        );
    }

    getVisibilityStatus(element) {
        if (!this.isVisible(element)) return "hidden";
        if (this.isInViewport(element)) return "in_viewport_full";
        if (this.isPartiallyInViewport(element)) return "in_viewport_partial";
        return "out_of_viewport";
    }
}