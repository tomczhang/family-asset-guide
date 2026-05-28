"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const PDFCrossRefSection_1 = tslib_1.__importDefault(require("../document/PDFCrossRefSection"));
const PDFHeader_1 = tslib_1.__importDefault(require("../document/PDFHeader"));
const PDFTrailer_1 = tslib_1.__importDefault(require("../document/PDFTrailer"));
const errors_1 = require("../errors");
const PDFDict_1 = tslib_1.__importDefault(require("../objects/PDFDict"));
const PDFInvalidObject_1 = tslib_1.__importDefault(require("../objects/PDFInvalidObject"));
const PDFName_1 = tslib_1.__importDefault(require("../objects/PDFName"));
const PDFRawStream_1 = tslib_1.__importDefault(require("../objects/PDFRawStream"));
const PDFRef_1 = tslib_1.__importDefault(require("../objects/PDFRef"));
const ByteStream_1 = tslib_1.__importDefault(require("./ByteStream"));
const PDFObjectParser_1 = tslib_1.__importDefault(require("./PDFObjectParser"));
const PDFObjectStreamParser_1 = tslib_1.__importDefault(require("./PDFObjectStreamParser"));
const PDFXRefStreamParser_1 = tslib_1.__importDefault(require("./PDFXRefStreamParser"));
const PDFContext_1 = tslib_1.__importDefault(require("../PDFContext"));
const CharCodes_1 = tslib_1.__importDefault(require("../syntax/CharCodes"));
const Keywords_1 = require("../syntax/Keywords");
const Numeric_1 = require("../syntax/Numeric");
const utils_1 = require("../../utils");
const PDFNumber_1 = tslib_1.__importDefault(require("../objects/PDFNumber"));
class PDFParser extends PDFObjectParser_1.default {
    constructor(pdfBytes, objectsPerTick = Infinity, throwOnInvalidObject = false, warnOnInvalidObjects = false, capNumbers = false, cryptoFactory, forIncrementalUpdate = false) {
        super(ByteStream_1.default.of(pdfBytes), PDFContext_1.default.create(), capNumbers, cryptoFactory);
        this.alreadyParsed = false;
        this.parsedObjects = 0;
        this.shouldWaitForTick = () => {
            this.parsedObjects += 1;
            return this.parsedObjects % this.objectsPerTick === 0;
        };
        this.objectsPerTick = objectsPerTick;
        this.throwOnInvalidObject = throwOnInvalidObject;
        this.warnOnInvalidObjects = warnOnInvalidObjects;
        this.context.isDecrypted = !!(cryptoFactory === null || cryptoFactory === void 0 ? void 0 : cryptoFactory.encryptionKey);
        this.context.pdfFileDetails.pdfSize = pdfBytes.length;
        if (forIncrementalUpdate) {
            this.context.pdfFileDetails.originalBytes = pdfBytes;
        }
    }
    parseDocument() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.alreadyParsed) {
                throw new errors_1.ReparseError('PDFParser', 'parseDocument');
            }
            this.alreadyParsed = true;
            this.context.header = this.parseHeader();
            let prevOffset;
            while (!this.bytes.done()) {
                yield this.parseDocumentSection();
                const offset = this.bytes.offset();
                if (offset === prevOffset) {
                    throw new errors_1.StalledParserError(this.bytes.position());
                }
                prevOffset = offset;
            }
            this.maybeRecoverRoot();
            if (this.context.lookup(PDFRef_1.default.of(0))) {
                console.warn('Removing parsed object: 0 0 R');
                this.context.delete(PDFRef_1.default.of(0));
            }
            return this.context;
        });
    }
    maybeRecoverRoot() {
        const isValidCatalog = (obj) => obj instanceof PDFDict_1.default &&
            obj.lookup(PDFName_1.default.of('Type')) === PDFName_1.default.of('Catalog');
        const catalog = this.context.lookup(this.context.trailerInfo.Root);
        if (!isValidCatalog(catalog)) {
            const indirectObjects = this.context.enumerateIndirectObjects();
            for (let idx = 0, len = indirectObjects.length; idx < len; idx++) {
                const [ref, object] = indirectObjects[idx];
                if (isValidCatalog(object)) {
                    this.context.trailerInfo.Root = ref;
                }
            }
        }
    }
    parseHeader() {
        while (!this.bytes.done()) {
            if (this.matchKeyword(Keywords_1.Keywords.header)) {
                const major = this.parseRawInt();
                this.bytes.assertNext(CharCodes_1.default.Period);
                const minor = this.parseRawInt();
                const header = PDFHeader_1.default.forVersion(major, minor);
                this.skipBinaryHeaderComment();
                return header;
            }
            this.bytes.next();
        }
        throw new errors_1.MissingPDFHeaderError(this.bytes.position());
    }
    parseIndirectObjectHeader() {
        this.skipWhitespaceAndComments();
        const objectNumber = this.parseRawInt();
        this.skipWhitespaceAndComments();
        const generationNumber = this.parseRawInt();
        this.skipWhitespaceAndComments();
        if (!this.matchKeyword(Keywords_1.Keywords.obj)) {
            throw new errors_1.MissingKeywordError(this.bytes.position(), Keywords_1.Keywords.obj);
        }
        return PDFRef_1.default.of(objectNumber, generationNumber);
    }
    matchIndirectObjectHeader() {
        const initialOffset = this.bytes.offset();
        try {
            this.parseIndirectObjectHeader();
            return true;
        }
        catch (e) {
            this.bytes.moveTo(initialOffset);
            return false;
        }
    }
    parseIndirectObject() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const ref = this.parseIndirectObjectHeader();
            this.skipWhitespaceAndComments();
            const object = this.parseObject(ref);
            this.skipWhitespaceAndComments();
            // if (!this.matchKeyword(Keywords.endobj)) {
            // throw new MissingKeywordError(this.bytes.position(), Keywords.endobj);
            // }
            // TODO: Log a warning if this fails...
            this.matchKeyword(Keywords_1.Keywords.endobj);
            if (object instanceof PDFRawStream_1.default &&
                object.dict.lookup(PDFName_1.default.of('Type')) === PDFName_1.default.of('ObjStm')) {
                yield PDFObjectStreamParser_1.default.forStream(object, this.shouldWaitForTick).parseIntoContext();
            }
            else if (object instanceof PDFRawStream_1.default &&
                object.dict.lookup(PDFName_1.default.of('Type')) === PDFName_1.default.of('XRef')) {
                PDFXRefStreamParser_1.default.forStream(object).parseIntoContext();
            }
            // always register the object and the ref, to properly handle object numeration
            this.context.assign(ref, object);
            return ref;
        });
    }
    // TODO: Improve and clean this up
    tryToParseInvalidIndirectObject() {
        const startPos = this.bytes.position();
        const msg = `Trying to parse invalid object: ${JSON.stringify(startPos)})`;
        if (this.throwOnInvalidObject)
            throw new Error(msg);
        if (this.warnOnInvalidObjects)
            console.warn(msg);
        const ref = this.parseIndirectObjectHeader();
        if (this.warnOnInvalidObjects)
            console.warn(`Invalid object ref: ${ref}`);
        this.skipWhitespaceAndComments();
        const start = this.bytes.offset();
        let failed = true;
        while (!this.bytes.done()) {
            if (this.matchKeyword(Keywords_1.Keywords.endobj)) {
                failed = false;
            }
            if (!failed)
                break;
            this.bytes.next();
        }
        if (failed)
            throw new errors_1.PDFInvalidObjectParsingError(startPos);
        const end = this.bytes.offset() - Keywords_1.Keywords.endobj.length;
        const object = PDFInvalidObject_1.default.of(this.bytes.slice(start, end));
        this.context.assign(ref, object);
        return ref;
    }
    parseIndirectObjects() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.skipWhitespaceAndComments();
            while (!this.bytes.done() && Numeric_1.IsDigit[this.bytes.peek()]) {
                const initialOffset = this.bytes.offset();
                try {
                    yield this.parseIndirectObject();
                }
                catch (e) {
                    // TODO: Add tracing/logging mechanism to track when this happens!
                    this.bytes.moveTo(initialOffset);
                    this.tryToParseInvalidIndirectObject();
                }
                this.skipWhitespaceAndComments();
                // TODO: Can this be done only when needed, to avoid harming performance?
                this.skipJibberish();
                if (this.shouldWaitForTick())
                    yield (0, utils_1.waitForTick)();
            }
        });
    }
    maybeParseCrossRefSection() {
        this.skipWhitespaceAndComments();
        if (!this.matchKeyword(Keywords_1.Keywords.xref))
            return;
        this.skipWhitespaceAndComments();
        let objectNumber = -1;
        const xref = PDFCrossRefSection_1.default.createEmpty();
        while (!this.bytes.done() && Numeric_1.IsDigit[this.bytes.peek()]) {
            const firstInt = this.parseRawInt();
            this.skipWhitespaceAndComments();
            // Check if second digit is valid integer
            if (!Numeric_1.IsDigit[this.bytes.peek()]) {
                return PDFCrossRefSection_1.default.createEmpty();
            }
            const secondInt = this.parseRawInt();
            this.skipWhitespaceAndComments();
            const byte = this.bytes.peek();
            if (byte === CharCodes_1.default.n || byte === CharCodes_1.default.f) {
                const ref = PDFRef_1.default.of(objectNumber, secondInt);
                if (this.bytes.next() === CharCodes_1.default.n) {
                    xref.addEntry(ref, firstInt);
                }
                else {
                    // this.context.delete(ref);
                    xref.addDeletedEntry(ref, firstInt);
                }
                objectNumber += 1;
            }
            else {
                objectNumber = firstInt;
            }
            this.skipWhitespaceAndComments();
        }
        return xref;
    }
    maybeParseTrailerDict() {
        this.skipWhitespaceAndComments();
        if (!this.matchKeyword(Keywords_1.Keywords.trailer))
            return;
        this.skipWhitespaceAndComments();
        const dict = this.parseDict();
        const { context } = this;
        context.trailerInfo = {
            Size: dict.lookupMaybe(PDFName_1.default.of('Size'), PDFNumber_1.default) ||
                context.trailerInfo.Size,
            Root: dict.get(PDFName_1.default.of('Root')) || context.trailerInfo.Root,
            Encrypt: dict.get(PDFName_1.default.of('Encrypt')) || context.trailerInfo.Encrypt,
            Info: dict.get(PDFName_1.default.of('Info')) || context.trailerInfo.Info,
            ID: dict.get(PDFName_1.default.of('ID')) || context.trailerInfo.ID,
        };
        // if open for incremental update, then deleted objects need to be preserved, and largestObjectNumber has to be Size-1
        if (context.trailerInfo.Size && context.pdfFileDetails.originalBytes) {
            context.largestObjectNumber = context.trailerInfo.Size.asNumber() - 1;
        }
    }
    maybeParseTrailer() {
        this.skipWhitespaceAndComments();
        if (!this.matchKeyword(Keywords_1.Keywords.startxref))
            return;
        this.skipWhitespaceAndComments();
        const offset = this.parseRawInt();
        this.context.pdfFileDetails.prevStartXRef = offset;
        this.skipWhitespace();
        this.matchKeyword(Keywords_1.Keywords.eof);
        this.skipWhitespaceAndComments();
        this.matchKeyword(Keywords_1.Keywords.eof);
        this.skipWhitespaceAndComments();
        return PDFTrailer_1.default.forLastCrossRefSectionOffset(offset);
    }
    parseDocumentSection() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.parseIndirectObjects();
            this.maybeParseCrossRefSection();
            this.maybeParseTrailerDict();
            this.maybeParseTrailer();
            // TODO: Can this be done only when needed, to avoid harming performance?
            this.skipJibberish();
        });
    }
    /**
     * This operation is not necessary for valid PDF files. But some invalid PDFs
     * contain jibberish in between indirect objects. This method is designed to
     * skip past that jibberish, should it exist, until it reaches the next
     * indirect object header, an xref table section, or the file trailer.
     */
    skipJibberish() {
        this.skipWhitespaceAndComments();
        while (!this.bytes.done()) {
            const initialOffset = this.bytes.offset();
            const byte = this.bytes.peek();
            const isAlphaNumeric = byte >= CharCodes_1.default.Space && byte <= CharCodes_1.default.Tilde;
            if (isAlphaNumeric) {
                if (this.matchKeyword(Keywords_1.Keywords.xref) ||
                    this.matchKeyword(Keywords_1.Keywords.trailer) ||
                    this.matchKeyword(Keywords_1.Keywords.startxref) ||
                    this.matchIndirectObjectHeader()) {
                    this.bytes.moveTo(initialOffset);
                    break;
                }
            }
            this.bytes.next();
        }
    }
    /**
     * Skips the binary comment following a PDF header. The specification
     * defines this binary comment (section 7.5.2 File Header) as a sequence of 4
     * or more bytes that are 128 or greater, and which are preceded by a "%".
     *
     * This would imply that to strip out this binary comment, we could check for
     * a sequence of bytes starting with "%", and remove all subsequent bytes that
     * are 128 or greater. This works for many documents that properly comply with
     * the spec. But in the wild, there are PDFs that omit the leading "%", and
     * include bytes that are less than 128 (e.g. 0 or 1). So in order to parse
     * these headers correctly, we just throw out all bytes leading up to the
     * first indirect object header.
     */
    skipBinaryHeaderComment() {
        this.skipWhitespaceAndComments();
        try {
            const initialOffset = this.bytes.offset();
            this.parseIndirectObjectHeader();
            this.bytes.moveTo(initialOffset);
        }
        catch (e) {
            this.bytes.next();
            this.skipWhitespaceAndComments();
        }
    }
}
PDFParser.forBytesWithOptions = (pdfBytes, objectsPerTick, throwOnInvalidObject, warnOnInvalidObjects, capNumbers, cryptoFactory, forIncrementalUpdate) => new PDFParser(pdfBytes, objectsPerTick, throwOnInvalidObject, warnOnInvalidObjects, capNumbers, cryptoFactory, forIncrementalUpdate);
exports.default = PDFParser;
//# sourceMappingURL=PDFParser.js.map