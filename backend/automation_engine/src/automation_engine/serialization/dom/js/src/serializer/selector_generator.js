export class SelectorGenerator {
    constructor() {
        this.path = [];
        this.idIndexes = [0];
        this.siblingStacks = [new Map()];
        // Priority of attributes to check for "clean" selectors
        this.testAttributes = ['data-testid', 'data-cy', 'data-qa', 'aria-label'];
    }

    enter(node) {
        let selector = node.tagName.toLowerCase();
        let foundStableIdentifier = false;

        // 1. Check for Unique ID (Fastest & Cleanest)
        if (node.id) {
            const escapedId = CSS.escape(node.id);
            if (document.getElementById(node.id) === node) {
                selector = `#${escapedId}`;
                this.path.push(selector);
                this.idIndexes.push(this.path.length - 1);
                return; 
            }
        }

        // 2. Check for Testing Attributes (Cleanest for UI Testing)
        for (const attr of this.testAttributes) {
            const attrValue = node.getAttribute(attr);
            if (attrValue) {
                selector += `[${attr}="${CSS.escape(attrValue)}"]`;
                foundStableIdentifier = true;
                break;
            }
        }

        // 3. Check for Meaningful Classes (Filter out Amazon's dynamic junk)
        if (!foundStableIdentifier && node.classList.length > 0) {
            // Filter: Ignore classes longer than 20 chars or those containing many digits (likely dynamic)
            const cleanClass = Array.from(node.classList).find(c => 
                c.length < 20 && !/\d{4,}/.test(c) && !c.includes('managed')
            );
            if (cleanClass) {
                selector += `.${CSS.escape(cleanClass)}`;
                foundStableIdentifier = true;
            }
        }

        // 4. Fallback to Sibling Index (Ensure strict uniqueness among all siblings)
        const currentLevel = this.siblingStacks[this.siblingStacks.length - 1];
        const count = (currentLevel.get(node.tagName) || 0) + 1;
        currentLevel.set(node.tagName, count);

        let isUnique = true;
        if (node.parentNode) {
            let matchCount = 0;
            for (let child of node.parentNode.children) {
                if (child.matches(selector)) {
                    matchCount++;
                    if (matchCount > 1) {
                        isUnique = false;
                        break;
                    }
                }
            }
        }

        if (!isUnique) {
            selector += `:nth-of-type(${count})`;
        }

        this.path.push(selector);
    }

    exit() {
        if (this._getLastIdIndex() === this.path.length - 1) {
            this.idIndexes.pop();
        }
        this.path.pop();
    }

    enterLevel() { this.siblingStacks.push(new Map()); }
    exitLevel() { this.siblingStacks.pop(); }
    getSelector() { return this.path.slice(this._getLastIdIndex()).join(" > "); }
    _getLastIdIndex() { return this.idIndexes[this.idIndexes.length - 1]; }
}