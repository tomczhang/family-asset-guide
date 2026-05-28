import PDFAcroTerminal from './PDFAcroTerminal.js';
class PDFAcroSignature extends PDFAcroTerminal {
}
PDFAcroSignature.fromDict = (dict, ref) => new PDFAcroSignature(dict, ref);
export default PDFAcroSignature;
//# sourceMappingURL=PDFAcroSignature.js.map