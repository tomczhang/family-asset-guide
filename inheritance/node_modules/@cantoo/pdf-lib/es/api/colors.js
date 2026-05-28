import { setFillingCmykColor, setFillingGrayscaleColor, setFillingRgbColor, setStrokingCmykColor, setStrokingGrayscaleColor, setStrokingRgbColor, } from './operators.js';
import { assertRange, assertIs, error } from '../utils/index.js';
import ColorParser from 'color';
export var ColorTypes;
(function (ColorTypes) {
    ColorTypes["Grayscale"] = "Grayscale";
    ColorTypes["RGB"] = "RGB";
    ColorTypes["CMYK"] = "CMYK";
})(ColorTypes || (ColorTypes = {}));
export const grayscale = (gray) => {
    assertRange(gray, 'gray', 0.0, 1.0);
    return { type: ColorTypes.Grayscale, gray };
};
export const rgb = (red, green, blue) => {
    assertRange(red, 'red', 0, 1);
    assertRange(green, 'green', 0, 1);
    assertRange(blue, 'blue', 0, 1);
    return { type: ColorTypes.RGB, red, green, blue };
};
export const cmyk = (cyan, magenta, yellow, key) => {
    assertRange(cyan, 'cyan', 0, 1);
    assertRange(magenta, 'magenta', 0, 1);
    assertRange(yellow, 'yellow', 0, 1);
    assertRange(key, 'key', 0, 1);
    return { type: ColorTypes.CMYK, cyan, magenta, yellow, key };
};
export const colorString = (color) => {
    assertIs(color, 'color', ['string']);
    const colorDescription = ColorParser(color).unitObject();
    return {
        rgb: rgb(colorDescription.r, colorDescription.g, colorDescription.b),
        alpha: colorDescription.alpha,
    };
};
// prettier-ignore
export const setFillingColor = (color) => color.type === ColorTypes.Grayscale ? setFillingGrayscaleColor(color.gray)
    : color.type === ColorTypes.RGB ? setFillingRgbColor(color.red, color.green, color.blue)
        : color.type === ColorTypes.CMYK ? setFillingCmykColor(color.cyan, color.magenta, color.yellow, color.key)
            : error(`Invalid color: ${JSON.stringify(color)}`);
// prettier-ignore
export const setStrokingColor = (color) => color.type === ColorTypes.Grayscale ? setStrokingGrayscaleColor(color.gray)
    : color.type === ColorTypes.RGB ? setStrokingRgbColor(color.red, color.green, color.blue)
        : color.type === ColorTypes.CMYK ? setStrokingCmykColor(color.cyan, color.magenta, color.yellow, color.key)
            : error(`Invalid color: ${JSON.stringify(color)}`);
// prettier-ignore
export const componentsToColor = (comps, scale = 1) => ((comps === null || comps === void 0 ? void 0 : comps.length) === 1 ? grayscale(comps[0] * scale)
    : (comps === null || comps === void 0 ? void 0 : comps.length) === 3 ? rgb(comps[0] * scale, comps[1] * scale, comps[2] * scale)
        : (comps === null || comps === void 0 ? void 0 : comps.length) === 4 ? cmyk(comps[0] * scale, comps[1] * scale, comps[2] * scale, comps[3] * scale)
            : undefined);
// prettier-ignore
export const colorToComponents = (color) => color.type === ColorTypes.Grayscale ? [color.gray]
    : color.type === ColorTypes.RGB ? [color.red, color.green, color.blue]
        : color.type === ColorTypes.CMYK ? [color.cyan, color.magenta, color.yellow, color.key]
            : error(`Invalid color: ${JSON.stringify(color)}`);
//# sourceMappingURL=colors.js.map