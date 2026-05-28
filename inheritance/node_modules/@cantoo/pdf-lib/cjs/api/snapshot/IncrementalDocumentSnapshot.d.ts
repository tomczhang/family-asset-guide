import type { PDFContext, PDFObject, PDFRef } from '../../core';
import type { DocumentSnapshot } from './DocumentSnapshot';
export declare class IncrementalDocumentSnapshot implements DocumentSnapshot {
    pdfSize: number;
    prevStartXRef: number;
    deletedCount: number;
    private deleted;
    private lastObjectNumber;
    private changedObjects;
    context: PDFContext;
    constructor(lastObjectNumber: number, indirectObjects: Set<number>, pdfSize: number, prevStartXRef: number, context: PDFContext);
    shouldSave(objectNumber: number): boolean;
    markRefForSave(ref: PDFRef): void;
    markRefsForSave(refs: PDFRef[]): void;
    markObjForSave(obj: PDFObject): void;
    markObjsForSave(objs: PDFObject[]): void;
    markDeletedRef(ref: PDFRef): void;
    markDeletedObj(obj: PDFObject): void;
    deletedRef(index: number): PDFRef | null;
}
//# sourceMappingURL=IncrementalDocumentSnapshot.d.ts.map