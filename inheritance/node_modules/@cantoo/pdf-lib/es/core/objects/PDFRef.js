import { PrivateConstructorError } from '../errors.js';
import PDFObject from '../objects/PDFObject.js';
import { copyStringIntoBuffer } from '../../utils/index.js';
const ENFORCER = {};
const pool = new Map();
class PDFRef extends PDFObject {
    constructor(enforcer, objectNumber, generationNumber) {
        if (enforcer !== ENFORCER)
            throw new PrivateConstructorError('PDFRef');
        super();
        this.objectNumber = objectNumber;
        this.generationNumber = generationNumber;
        this.tag = `${objectNumber} ${generationNumber} R`;
    }
    clone() {
        return this;
    }
    toString() {
        return this.tag;
    }
    sizeInBytes() {
        return this.tag.length;
    }
    copyBytesInto(buffer, offset) {
        copyStringIntoBuffer(this.tag, buffer, offset);
        return this.tag.length;
    }
}
PDFRef.of = (objectNumber, generationNumber = 0) => {
    const tag = `${objectNumber} ${generationNumber} R`;
    let instance = pool.get(tag);
    if (!instance) {
        instance = new PDFRef(ENFORCER, objectNumber, generationNumber);
        pool.set(tag, instance);
    }
    return instance;
};
export default PDFRef;
//# sourceMappingURL=PDFRef.js.map