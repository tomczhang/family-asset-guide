import PDFAcroButton from './PDFAcroButton.js';
import { AcroButtonFlags } from './flags.js';
class PDFAcroPushButton extends PDFAcroButton {
}
PDFAcroPushButton.fromDict = (dict, ref) => new PDFAcroPushButton(dict, ref);
PDFAcroPushButton.create = (context) => {
    const dict = context.obj({
        FT: 'Btn',
        Ff: AcroButtonFlags.PushButton,
        Kids: [],
    });
    const ref = context.register(dict);
    return new PDFAcroPushButton(dict, ref);
};
export default PDFAcroPushButton;
//# sourceMappingURL=PDFAcroPushButton.js.map