"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const PDFHexString_1 = tslib_1.__importDefault(require("../objects/PDFHexString"));
class JavaScriptEmbedder {
    static for(script, scriptName) {
        return new JavaScriptEmbedder(script, scriptName);
    }
    constructor(script, scriptName) {
        this.script = script;
        this.scriptName = scriptName;
    }
    embedIntoContext(context, ref) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const jsActionDict = context.obj({
                Type: 'Action',
                S: 'JavaScript',
                JS: PDFHexString_1.default.fromText(this.script),
            });
            if (ref) {
                context.assign(ref, jsActionDict);
                return ref;
            }
            else {
                return context.register(jsActionDict);
            }
        });
    }
}
exports.default = JavaScriptEmbedder;
//# sourceMappingURL=JavaScriptEmbedder.js.map