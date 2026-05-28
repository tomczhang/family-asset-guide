import type { DocumentSnapshot } from '../api';
import PDFHeader from './document/PDFHeader';
import PDFArray from './objects/PDFArray';
import PDFBool from './objects/PDFBool';
import PDFDict from './objects/PDFDict';
import PDFHexString from './objects/PDFHexString';
import PDFName from './objects/PDFName';
import PDFNull from './objects/PDFNull';
import PDFNumber from './objects/PDFNumber';
import PDFObject from './objects/PDFObject';
import PDFRawStream from './objects/PDFRawStream';
import PDFRef from './objects/PDFRef';
import PDFStream from './objects/PDFStream';
import PDFString from './objects/PDFString';
import PDFOperator from './operators/PDFOperator';
import PDFContentStream from './structures/PDFContentStream';
import PDFSecurity from './security/PDFSecurity';
import { SimpleRNG } from '../utils/rng';
type LookupKey = PDFRef | PDFObject | undefined;
interface LiteralObject {
    [name: string]: Literal | PDFObject;
}
interface LiteralArray {
    [index: number]: Literal | PDFObject;
}
type Literal = LiteralObject | LiteralArray | string | number | boolean | null | undefined;
interface LiteralConfig {
    deep?: boolean;
    literalRef?: boolean;
    literalStreamDict?: boolean;
    literalString?: boolean;
}
declare class PDFContext {
    isDecrypted: boolean;
    static create: () => PDFContext;
    largestObjectNumber: number;
    header: PDFHeader;
    trailerInfo: {
        Size?: PDFNumber;
        Root?: PDFObject;
        Encrypt?: PDFObject;
        Info?: PDFObject;
        ID?: PDFObject;
    };
    rng: SimpleRNG;
    pdfFileDetails: {
        pdfSize: number;
        prevStartXRef: number;
        useObjectStreams: boolean;
        originalBytes?: Uint8Array;
    };
    snapshot?: DocumentSnapshot;
    security?: PDFSecurity;
    private readonly indirectObjects;
    private pushGraphicsStateContentStreamRef?;
    private popGraphicsStateContentStreamRef?;
    private constructor();
    assign(ref: PDFRef, object: PDFObject): void;
    nextRef(): PDFRef;
    register(object: PDFObject): PDFRef;
    delete(ref: PDFRef): boolean;
    lookupMaybe(ref: LookupKey, type: typeof PDFArray): PDFArray | undefined;
    lookupMaybe(ref: LookupKey, type: typeof PDFBool): PDFBool | undefined;
    lookupMaybe(ref: LookupKey, type: typeof PDFDict): PDFDict | undefined;
    lookupMaybe(ref: LookupKey, type: typeof PDFHexString): PDFHexString | undefined;
    lookupMaybe(ref: LookupKey, type: typeof PDFName): PDFName | undefined;
    lookupMaybe(ref: LookupKey, type: typeof PDFNull): typeof PDFNull | undefined;
    lookupMaybe(ref: LookupKey, type: typeof PDFNumber): PDFNumber | undefined;
    lookupMaybe(ref: LookupKey, type: typeof PDFStream): PDFStream | undefined;
    lookupMaybe(ref: LookupKey, type: typeof PDFRef): PDFRef | undefined;
    lookupMaybe(ref: LookupKey, type: typeof PDFString): PDFString | undefined;
    lookupMaybe(ref: LookupKey, type1: typeof PDFString, type2: typeof PDFHexString): PDFString | PDFHexString | undefined;
    lookup(ref: LookupKey): PDFObject | undefined;
    lookup(ref: LookupKey, type: typeof PDFArray): PDFArray;
    lookup(ref: LookupKey, type: typeof PDFBool): PDFBool;
    lookup(ref: LookupKey, type: typeof PDFDict): PDFDict;
    lookup(ref: LookupKey, type: typeof PDFHexString): PDFHexString;
    lookup(ref: LookupKey, type: typeof PDFName): PDFName;
    lookup(ref: LookupKey, type: typeof PDFNull): typeof PDFNull;
    lookup(ref: LookupKey, type: typeof PDFNumber): PDFNumber;
    lookup(ref: LookupKey, type: typeof PDFStream): PDFStream;
    lookup(ref: LookupKey, type: typeof PDFRef): PDFRef;
    lookup(ref: LookupKey, type: typeof PDFString): PDFString;
    lookup(ref: LookupKey, type1: typeof PDFString, type2: typeof PDFHexString): PDFString | PDFHexString;
    getRef(pdfObject: PDFObject | PDFRef): PDFRef | undefined;
    getObjectRef(pdfObject: PDFObject): PDFRef | undefined;
    enumerateIndirectObjects(): [PDFRef, PDFObject][];
    obj(literal: null | undefined): typeof PDFNull;
    obj(literal: string): PDFName;
    obj(literal: number): PDFNumber;
    obj(literal: boolean): PDFBool;
    obj(literal: LiteralObject): PDFDict;
    obj(literal: LiteralArray): PDFArray;
    getLiteral(obj: PDFArray, cfg?: LiteralConfig): LiteralArray;
    getLiteral(obj: PDFBool, cfg?: LiteralConfig): boolean;
    getLiteral(obj: PDFDict, cfg?: LiteralConfig): LiteralObject;
    getLiteral(obj: PDFHexString, cfg?: LiteralConfig): PDFHexString | string;
    getLiteral(obj: PDFName, cfg?: LiteralConfig): string;
    getLiteral(obj: typeof PDFNull, cfg?: LiteralConfig): null;
    getLiteral(obj: PDFNumber, cfg?: LiteralConfig): number;
    getLiteral(obj: PDFRef, cfg?: LiteralConfig): PDFRef | number;
    getLiteral(obj: PDFStream, cfg?: LiteralConfig): PDFStream | LiteralObject;
    getLiteral(obj: PDFString, cfg?: LiteralConfig): PDFString | string;
    getLiteral(obj: PDFObject, cfg?: LiteralConfig): PDFObject;
    stream(contents: string | Uint8Array, dict?: LiteralObject): PDFRawStream;
    flateStream(contents: string | Uint8Array, dict?: LiteralObject): PDFRawStream;
    contentStream(operators: PDFOperator[], dict?: LiteralObject): PDFContentStream;
    formXObject(operators: PDFOperator[], dict?: LiteralObject): PDFContentStream;
    getPushGraphicsStateContentStream(): PDFRef;
    getPopGraphicsStateContentStream(): PDFRef;
    addRandomSuffix(prefix: string, suffixLength?: number): string;
    registerObjectChange(obj: PDFObject): void;
    private findContainingIndirectObject;
    private objectContains;
}
export default PDFContext;
//# sourceMappingURL=PDFContext.d.ts.map