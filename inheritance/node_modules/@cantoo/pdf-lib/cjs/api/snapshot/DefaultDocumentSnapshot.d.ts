import type { PDFObject, PDFRef } from '../../core';
import type { DocumentSnapshot } from './DocumentSnapshot';
export declare class DefaultDocumentSnapshot implements DocumentSnapshot {
    pdfSize: number;
    prevStartXRef: number;
    deletedCount: number;
    shouldSave(_objectNumber: number): boolean;
    markRefForSave(_ref: PDFRef): void;
    markRefsForSave(_refs: PDFRef[]): void;
    markObjForSave(_obj: PDFObject): void;
    markObjsForSave(_objs: PDFObject[]): void;
    markDeletedObj(_obj: PDFObject): void;
    markDeletedRef(_ref: PDFRef): void;
    deletedRef(_index: number): PDFRef | null;
}
export declare const defaultDocumentSnapshot: DefaultDocumentSnapshot;
//# sourceMappingURL=DefaultDocumentSnapshot.d.ts.map