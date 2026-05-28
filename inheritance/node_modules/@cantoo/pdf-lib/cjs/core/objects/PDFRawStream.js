"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const PDFStream_1 = tslib_1.__importDefault(require("./PDFStream"));
const utils_1 = require("../../utils");
class PDFRawStream extends PDFStream_1.default {
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
        return (0, utils_1.arrayAsString)(this.contents);
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
exports.default = PDFRawStream;
//# sourceMappingURL=PDFRawStream.js.map