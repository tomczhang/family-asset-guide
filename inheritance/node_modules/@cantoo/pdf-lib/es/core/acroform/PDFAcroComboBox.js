import PDFAcroChoice from './PDFAcroChoice.js';
import { AcroChoiceFlags } from './flags.js';
class PDFAcroComboBox extends PDFAcroChoice {
}
PDFAcroComboBox.fromDict = (dict, ref) => new PDFAcroComboBox(dict, ref);
PDFAcroComboBox.create = (context) => {
    const dict = context.obj({
        FT: 'Ch',
        Ff: AcroChoiceFlags.Combo,
        Kids: [],
    });
    const ref = context.register(dict);
    return new PDFAcroComboBox(dict, ref);
};
export default PDFAcroComboBox;
//# sourceMappingURL=PDFAcroComboBox.js.map