import pako from 'pako';
import { MethodNotImplementedError } from '../errors.js';
import PDFName from '../objects/PDFName.js';
import PDFStream from '../objects/PDFStream.js';
import { Cache } from '../../utils/index.js';
class PDFFlateStream extends PDFStream {
    constructor(dict, encode) {
        super(dict);
        this.computeContents = () => {
            const unencodedContents = this.getUnencodedContents();
            return this.encode ? pako.deflate(unencodedContents) : unencodedContents;
        };
        this.encode = encode;
        if (encode)
            dict.set(PDFName.of('Filter'), PDFName.of('FlateDecode'));
        this.contentsCache = Cache.populatedBy(this.computeContents);
    }
    getContents() {
        return this.contentsCache.access();
    }
    getContentsSize() {
        return this.contentsCache.access().length;
    }
    getUnencodedContents() {
        throw new MethodNotImplementedError(this.constructor.name, 'getUnencodedContents');
    }
    updateContents(contents) {
        this.contentsCache = Cache.populatedBy(() => contents);
    }
}
export default PDFFlateStream;
//# sourceMappingURL=PDFFlateStream.js.map