import { ElementValidator } from './element_validator.js';
import { ElementDataExtractor } from './data_extractor.js';
import { SelectorGenerator } from './selector_generator.js';

export class DOMTraverser {
    constructor() {
        this.validator = new ElementValidator();
        this.extractor = new ElementDataExtractor(this.validator);
    }

    traverse(node, selectorGen, depth = 0, isRoot = true, elementId = 0) {
        selectorGen.enter(node);

        const elementData = this.extractor.extract(node);
        const children = [];
        const interactive = this.validator.isInteractive(node);
        const semantic = this.validator.isSemantic(node);
        const worthKeeping = interactive || (
            elementData.visibility !== "hidden"
            && semantic && this.extractor.hasImportantData(elementData)
        ) || isRoot;

        if (worthKeeping) {
            node.setAttribute('data-qualia-testing-element-id', elementId);
        }

        elementData.depth = depth;
        elementData.selector = selectorGen.getSelector();
        elementData.is_interactive = interactive;
        elementData.element_id = elementId;

        let elementCount = worthKeeping ? 1 : 0;

        // Traverse children
        selectorGen.enterLevel();
        for (const child of node.children) {
            const [subtreeSize, childrenData] = this.traverse(
                child,
                selectorGen,
                depth + worthKeeping,
                false,
                elementId + elementCount
            );

            elementCount += subtreeSize;
            if (childrenData.length > 0) {
                children.push(...childrenData);
            }
        }
        selectorGen.exitLevel();

        if (children.length > 0) {
            elementData.children = children;
        }

        selectorGen.exit();

        if (worthKeeping) {
            return [elementCount, [elementData]];
        }
        return [elementCount, children];
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