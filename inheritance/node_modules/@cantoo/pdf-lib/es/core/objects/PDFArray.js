import PDFNumber from './PDFNumber.js';
import PDFObject from './PDFObject.js';
import CharCodes from '../syntax/CharCodes.js';
import { PDFArrayIsNotRectangleError } from '../errors.js';
class PDFArray extends PDFObject {
    constructor(context) {
        super();
        this.array = [];
        this.context = context;
    }
    size() {
        return this.array.length;
    }
    push(object) {
        this.registerChange();
        this.array.push(object);
    }
    insert(index, object) {
        this.registerChange();
        this.array.splice(index, 0, object);
    }
    indexOf(object) {
        const index = this.array.indexOf(object);
        return index === -1 ? undefined : index;
    }
    remove(index) {
        this.registerChange();
        this.array.splice(index, 1);
    }
    set(idx, object) {
        this.registerChange();
        this.array[idx] = object;
    }
    get(index) {
        return this.array[index];
    }
    lookupMaybe(index, ...types) {
        return this.context.lookupMaybe(this.get(index), 
        // @ts-ignore
        ...types);
    }
    lookup(index, ...types) {
        return this.context.lookup(this.get(index), 
        // @ts-ignore
        ...types);
    }
    asRectangle() {
        if (this.size() !== 4)
            throw new PDFArrayIsNotRectangleError(this.size());
        const x1 = this.lookup(0, PDFNumber).asNumber();
        const y1 = this.lookup(1, PDFNumber).asNumber();
        const x2 = this.lookup(2, PDFNumber).asNumber();
        const y2 = this.lookup(3, PDFNumber).asNumber();
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x1 - x2);
        const height = Math.abs(y1 - y2);
        return { x, y, width, height };
    }
    asArray() {
        return this.array.slice();
    }
    clone(context) {
        const clone = PDFArray.withContext(context || this.context);
        for (let idx = 0, len = this.size(); idx < len; idx++) {
            clone.push(this.array[idx]);
        }
        return clone;
    }
    toString() {
        let arrayString = '[ ';
        for (let idx = 0, len = this.size(); idx < len; idx++) {
            arrayString += this.get(idx).toString();
            arrayString += ' ';
        }
        arrayString += ']';
        return arrayString;
    }
    sizeInBytes() {
        let size = 3;
        for (let idx = 0, len = this.size(); idx < len; idx++) {
            size += this.get(idx).sizeInBytes() + 1;
        }
        return size;
    }
    copyBytesInto(buffer, offset) {
        const initialOffset = offset;
        buffer[offset++] = CharCodes.LeftSquareBracket;
        buffer[offset++] = CharCodes.Space;
        for (let idx = 0, len = this.size(); idx < len; idx++) {
            offset += this.get(idx).copyBytesInto(buffer, offset);
            buffer[offset++] = CharCodes.Space;
        }
        buffer[offset++] = CharCodes.RightSquareBracket;
        return offset - initialOffset;
    }
    scalePDFNumbers(x, y) {
        for (let idx = 0, len = this.size(); idx < len; idx++) {
            const el = this.lookup(idx);
            if (el instanceof PDFNumber) {
                const factor = idx % 2 === 0 ? x : y;
                this.set(idx, PDFNumber.of(el.asNumber() * factor));
            }
        }
    }
    registerChange() {
        this.context.registerObjectChange(this);
    }
}
PDFArray.withContext = (context) => new PDFArray(context);
export default PDFArray;
//# sourceMappingURL=PDFArray.js.map