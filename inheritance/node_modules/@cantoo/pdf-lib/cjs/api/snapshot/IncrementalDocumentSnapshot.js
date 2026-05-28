"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncrementalDocumentSnapshot = void 0;
class IncrementalDocumentSnapshot {
    constructor(lastObjectNumber, indirectObjects, pdfSize, prevStartXRef, context) {
        this.deletedCount = 0;
        this.deleted = [];
        this.lastObjectNumber = lastObjectNumber;
        this.changedObjects = indirectObjects;
        this.pdfSize = pdfSize;
        this.prevStartXRef = prevStartXRef;
        this.context = context;
    }
    shouldSave(objectNumber) {
        if (objectNumber > this.lastObjectNumber)
            return true;
        return this.changedObjects.has(objectNumber);
    }
    markRefForSave(ref) {
        this.markRefsForSave([ref]);
    }
    markRefsForSave(refs) {
        refs.forEach((ref) => {
            if (ref)
                this.changedObjects.add(ref.objectNumber);
        });
    }
    markObjForSave(obj) {
        this.markObjsForSave([obj]);
    }
    markObjsForSave(objs) {
        this.markRefsForSave(objs
            .map((obj) => this.context.getRef(obj))
            .filter((ref) => ref !== undefined));
    }
    markDeletedRef(ref) {
        if (this.deleted.findIndex((dref) => dref.objectNumber === ref.objectNumber) <
            0) {
            this.deletedCount = this.deleted.push(ref);
        }
    }
    markDeletedObj(obj) {
        const oref = this.context.getRef(obj);
        if (oref)
            this.markDeletedRef(oref);
    }
    deletedRef(index) {
        if (index < 0 || index >= this.deleted.length)
            return null;
        return this.deleted[index];
    }
}
exports.IncrementalDocumentSnapshot = IncrementalDocumentSnapshot;
//# sourceMappingURL=IncrementalDocumentSnapshot.js.map