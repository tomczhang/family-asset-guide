import PDFStream from './PDFStream.js';
import { arrayAsString } from '../../utils/index.js';
class PDFRawStream extends PDFStream {
    constructor(dict, contents, transform) {
        super(dict);
        this.contents = contents;
        this.transform = transform;
    }
    asUint8Array() {
        return this.contents.slice();
    }
    clone(context) {
        return PDFRawStream.of(this.dict.clone(context), this.contents.slice());
    }
    getContentsString() {
        return arrayAsString(this.contents);
    }
    getContents() {
        return this.contents;
    }
    getContentsSize() {
        return this.contents.length;
    }
    updateContents(contents) {
        this.dict.registerChange();
        this.contents = contents;
    }
}
PDFRawStream.of = (dict, contents, transform) => new PDFRawStream(dict, contents, transform);
export default PDFRawStream;
//# sourceMappingURL=PDFRawStream.js.map