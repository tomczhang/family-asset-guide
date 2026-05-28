import PDFObject from './PDFObject.js';
import CharCodes from '../syntax/CharCodes.js';
class PDFNull extends PDFObject {
    asNull() {
        return null;
    }
    clone() {
        return this;
    }
    toString() {
        return 'null';
    }
    sizeInBytes() {
        return 4;
    }
    copyBytesInto(buffer, offset) {
        buffer[offset++] = CharCodes.n;
        buffer[offset++] = CharCodes.u;
        buffer[offset++] = CharCodes.l;
        buffer[offset++] = CharCodes.l;
        return 4;
    }
}
export default new PDFNull();
//# sourceMappingURL=PDFNull.js.map