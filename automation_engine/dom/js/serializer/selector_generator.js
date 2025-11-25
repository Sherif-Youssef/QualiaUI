export class SelectorGenerator {
    constructor() {
        this.path = [];
        this.idIndexes = [0];
        this.siblingCounters = [new Map()];
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

    exit() {
        if (this._getLastIdIndex() === this.path.length - 1) {
            this.idIndexes.pop();
        }
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

    _getLastIdIndex() {
        return this.idIndexes[this.idIndexes.length - 1];
    }
}