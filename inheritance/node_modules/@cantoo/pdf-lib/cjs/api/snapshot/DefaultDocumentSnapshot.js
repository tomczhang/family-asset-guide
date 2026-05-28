"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDocumentSnapshot = exports.DefaultDocumentSnapshot = void 0;
class DefaultDocumentSnapshot {
    constructor() {
        this.pdfSize = 0;
        this.prevStartXRef = 0;
        this.deletedCount = 0;
    }
    shouldSave(_objectNumber) {
        return true;
    }
    markRefForSave(_ref) {
        throw new Error('This method should not be called.');
    }
    markRefsForSave(_refs) {
        throw new Error('This method should not be called.');
    }
    markObjForSave(_obj) {
        throw new Error('This method should not be called.');
    }
    markObjsForSave(_objs) {
        throw new Error('This method should not be called.');
    }
    markDeletedObj(_obj) {
        throw new Error('This method should not be called.');
    }
    markDeletedRef(_ref) {
        throw new Error('This method should not be called.');
    }
    deletedRef(_index) {
        throw new Error('This method should not be called.');
    }
}
exports.DefaultDocumentSnapshot = DefaultDocumentSnapshot;
exports.defaultDocumentSnapshot = new DefaultDocumentSnapshot();
//# sourceMappingURL=DefaultDocumentSnapshot.js.map