import { __awaiter } from "tslib";
import { MissingPageContentsEmbeddingError, UnrecognizedStreamTypeError, } from '../errors.js';
import PDFNumber from '../objects/PDFNumber.js';
import PDFRawStream from '../objects/PDFRawStream.js';
import PDFStream from '../objects/PDFStream.js';
import { decodePDFRawStream } from '../streams/decode.js';
import PDFContentStream from '../structures/PDFContentStream.js';
import CharCodes from '../syntax/CharCodes.js';
import { mergeIntoTypedArray } from '../../utils/index.js';
const fullPageBoundingBox = (page) => {
    const mediaBox = page.MediaBox();
    const x0 = mediaBox.lookup(0, PDFNumber).asNumber();
    const y0 = mediaBox.lookup(1, PDFNumber).asNumber();
    const x1 = mediaBox.lookup(2, PDFNumber).asNumber();
    const y1 = mediaBox.lookup(3, PDFNumber).asNumber();
    return {
        left: Math.min(x0, x1),
        bottom: Math.min(y0, y1),
        right: Math.max(x0, x1),
        top: Math.max(y0, y1),
    };
};
// Returns the identity matrix, modified to position the content of the given
// bounding box at (0, 0).
const boundingBoxAdjustedMatrix = (bb) => [1, 0, 0, 1, -bb.left, -bb.bottom];
class PDFPageEmbedder {
    static for(page, boundingBox, transformationMatrix) {
        return __awaiter(this, void 0, void 0, function* () {
            return new PDFPageEmbedder(page, boundingBox, transformationMatrix);
        });
    }
    constructor(page, boundingBox, transformationMatrix) {
        this.page = page;
        const bb = boundingBox !== null && boundingBox !== void 0 ? boundingBox : fullPageBoundingBox(page);
        this.width = bb.right - bb.left;
        this.height = bb.top - bb.bottom;
        this.boundingBox = bb;
        this.transformationMatrix =
            transformationMatrix !== null && transformationMatrix !== void 0 ? transformationMatrix : boundingBoxAdjustedMatrix(bb);
    }
    embedIntoContext(context, ref) {
        return __awaiter(this, void 0, void 0, function* () {
            const { Contents, Resources } = this.page.normalizedEntries();
            if (!Contents)
                throw new MissingPageContentsEmbeddingError();
            const decodedContents = this.decodeContents(Contents);
            const { left, bottom, right, top } = this.boundingBox;
            const xObject = context.flateStream(decodedContents, {
                Type: 'XObject',
                Subtype: 'Form',
                FormType: 1,
                BBox: [left, bottom, right, top],
                Matrix: this.transformationMatrix,
                Resources,
            });
            if (ref) {
                context.assign(ref, xObject);
                return ref;
            }
            else {
                return context.register(xObject);
            }
        });
    }
    // `contents` is an array of streams which are merged to include them in the XObject.
    // This methods extracts each stream and joins them with a newline character.
    decodeContents(contents) {
        const newline = Uint8Array.of(CharCodes.Newline);
        const decodedContents = [];
        for (let idx = 0, len = contents.size(); idx < len; idx++) {
            const stream = contents.lookup(idx, PDFStream);
            let content;
            if (stream instanceof PDFRawStream) {
                content = decodePDFRawStream(stream).decode();
            }
            else if (stream instanceof PDFContentStream) {
                content = stream.getUnencodedContents();
            }
            else {
                throw new UnrecognizedStreamTypeError(stream);
            }
            decodedContents.push(content, newline);
        }
        return mergeIntoTypedArray(...decodedContents);
    }
}
export default PDFPageEmbedder;
//# sourceMappingURL=PDFPageEmbedder.js.map