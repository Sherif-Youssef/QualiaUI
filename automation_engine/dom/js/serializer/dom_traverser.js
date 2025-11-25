// traversers/DOMTraverser.js
import { ElementValidator } from './element_validator.js';
import { ElementDataExtractor } from './data_extractor.js';
import { SelectorGenerator } from './selector_generator.js';

export class DOMTraverser {
    constructor() {
        this.validator = new ElementValidator();
        this.extractor = new ElementDataExtractor(this.validator);
    }

    traverse(node, selectorGen, depth = 0, root = true, interactiveId = 0) {
        selectorGen.enter(node);

        const elementData = this.extractor.extract(node);
        elementData.depth = depth;
        elementData.selector = selectorGen.getSelector();

        const children = [];
        const interactive = this.validator.isInteractive(node);
        const semantic = this.validator.isSemantic(node);
        const worthKeeping = interactive || 
                            (semantic && this.extractor.hasImportantData(elementData)) || 
                            root;

        if (interactive) {
            elementData.interactive_id = interactiveId;
        }

        let interactiveCount = interactive ? 1 : 0;

        // Traverse children
        selectorGen.enterLevel();
        for (const child of node.children) {
            const [childInteractiveCount, childrenData] = this.traverse(
                child,
                selectorGen,
                depth + (worthKeeping ? 1 : 0),
                false,
                interactiveId + interactiveCount
            );

            if (childrenData.length > 0) {
                interactiveCount += childInteractiveCount;
                children.push(...childrenData);
            }
        }
        selectorGen.exitLevel();

        if (children.length > 0) {
            elementData.children = children;
        }

        selectorGen.exit();

        if (worthKeeping) {
            return [interactiveCount, [elementData]];
        }
        return [interactiveCount, children];
    }

    getSimplifiedDOM() {
        const selectorGen = new SelectorGenerator();
        const tree = this.traverse(document.body, selectorGen)[1];
        
        if (tree.length === 0) {
            return null;
        }
        
        return tree[0];
    }
}