import { setFillingColor, setStrokingColor } from './colors.js';
import { beginText, closePath, drawObject, endText, fill, fillAndStroke, lineTo, moveTo, nextLine, popGraphicsState, pushGraphicsState, rotateAndSkewTextRadiansAndTranslate, rotateRadians, scale, setFontAndSize, setLineHeight, setLineWidth, showText, skewRadians, stroke, translate, setLineCap, rotateDegrees, setGraphicsState, setDashPattern, beginMarkedContent, endMarkedContent, clip, endPath, FillRule, fillEvenOdd, concatTransformationMatrix, setTextRenderingMode, } from './operators.js';
import { degrees, toDegrees, toRadians } from './rotations.js';
import { svgPathToOperators } from './svgPath.js';
import { asNumber } from './objects.js';
import { transformationToMatrix, combineMatrix } from './svg.js';
import { identityMatrix } from '../types/matrix.js';
const clipSpace = ({ topLeft, topRight, bottomRight, bottomLeft }) => [
    moveTo(topLeft.x, topLeft.y),
    lineTo(topRight.x, topRight.y),
    lineTo(bottomRight.x, bottomRight.y),
    lineTo(bottomLeft.x, bottomLeft.y),
    closePath(),
    clip(),
    endPath(),
];
const clipSpaces = (spaces) => spaces.flatMap(clipSpace);
export const drawText = (line, options) => [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),
    beginText(),
    setFillingColor(options.color),
    setFontAndSize(options.font, options.size),
    options.strokeWidth && setLineWidth(options.strokeWidth),
    options.strokeColor && setStrokingColor(options.strokeColor),
    options.renderMode && setTextRenderingMode(options.renderMode),
    rotateAndSkewTextRadiansAndTranslate(toRadians(options.rotate), toRadians(options.xSkew), toRadians(options.ySkew), options.x, options.y),
    showText(line),
    endText(),
    popGraphicsState(),
].filter(Boolean);
export const drawLinesOfText = (lines, options) => {
    const operators = [
        pushGraphicsState(),
        options.graphicsState && setGraphicsState(options.graphicsState),
        ...(options.clipSpaces ? clipSpaces(options.clipSpaces) : []),
        options.matrix && concatTransformationMatrix(...options.matrix),
        beginText(),
        setFillingColor(options.color),
        setFontAndSize(options.font, options.size),
        setLineHeight(options.lineHeight),
        options.strokeWidth && setLineWidth(options.strokeWidth),
        options.strokeColor && setStrokingColor(options.strokeColor),
        options.renderMode && setTextRenderingMode(options.renderMode),
        rotateAndSkewTextRadiansAndTranslate(toRadians(options.rotate), toRadians(options.xSkew), toRadians(options.ySkew), options.x, options.y),
    ].filter(Boolean);
    for (let idx = 0, len = lines.length; idx < len; idx++) {
        operators.push(showText(lines[idx]), nextLine());
    }
    operators.push(endText(), popGraphicsState());
    return operators;
};
export const drawImage = (name, options) => [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),
    ...(options.clipSpaces ? clipSpaces(options.clipSpaces) : []),
    options.matrix && concatTransformationMatrix(...options.matrix),
    translate(options.x, options.y),
    rotateRadians(toRadians(options.rotate)),
    scale(options.width, options.height),
    skewRadians(toRadians(options.xSkew), toRadians(options.ySkew)),
    drawObject(name),
    popGraphicsState(),
].filter(Boolean);
export const drawPage = (name, options) => [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),
    translate(options.x, options.y),
    rotateRadians(toRadians(options.rotate)),
    scale(options.xScale, options.yScale),
    skewRadians(toRadians(options.xSkew), toRadians(options.ySkew)),
    drawObject(name),
    popGraphicsState(),
].filter(Boolean);
export const drawLine = (options) => {
    var _a, _b;
    return [
        pushGraphicsState(),
        options.graphicsState && setGraphicsState(options.graphicsState),
        ...(options.clipSpaces ? clipSpaces(options.clipSpaces) : []),
        options.matrix && concatTransformationMatrix(...options.matrix),
        options.color && setStrokingColor(options.color),
        setLineWidth(options.thickness),
        setDashPattern((_a = options.dashArray) !== null && _a !== void 0 ? _a : [], (_b = options.dashPhase) !== null && _b !== void 0 ? _b : 0),
        moveTo(options.start.x, options.start.y),
        options.lineCap && setLineCap(options.lineCap),
        moveTo(options.start.x, options.start.y),
        lineTo(options.end.x, options.end.y),
        stroke(),
        popGraphicsState(),
    ].filter(Boolean);
};
const KAPPA = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);
export const drawRectangle = (options) => {
    const { width, height, xSkew, ySkew, rotate, matrix } = options;
    const w = typeof width === 'number' ? width : width.asNumber();
    const h = typeof height === 'number' ? height : height.asNumber();
    const x = typeof options.x === 'number' ? options.x : options.x.asNumber();
    const y = typeof options.y === 'number' ? options.y : options.y.asNumber();
    // Ensure rx and ry are within bounds
    const rx = Math.max(0, Math.min(options.rx || 0, w / 2));
    const ry = Math.max(0, Math.min(options.ry || 0, h / 2));
    // Generate the SVG path
    const d = rx > 0 || ry > 0
        ? [
            `M ${rx},0`,
            `H ${w - rx}`,
            `C ${w - rx * (1 - KAPPA)},0 ${w},${ry * (1 - KAPPA)} ${w},${ry}`,
            `V ${h - ry}`,
            `C ${w},${h - ry * (1 - KAPPA)} ${w - rx * (1 - KAPPA)},${h} ${w - rx},${h}`,
            `H ${rx}`,
            `C ${rx * (1 - KAPPA)},${h} 0,${h - ry * (1 - KAPPA)} 0,${h - ry}`,
            `V ${ry}`,
            `C 0,${ry * (1 - KAPPA)} ${rx * (1 - KAPPA)},0 ${rx},0`,
            'Z',
        ].join(' ')
        : `M 0,0 H ${w} V ${h} H 0 Z`;
    // the drawRectangle applies the rotation around its anchor point (bottom-left), it means that the translation should be applied before the rotation
    // invert the y parameter because transformationToMatrix expects parameters from an svg space. The same is valid for rotate and ySkew
    let fullMatrix = combineMatrix(matrix || identityMatrix, transformationToMatrix('translate', [x, -y]));
    // Transformation to apply rotation and skew
    if (rotate) {
        fullMatrix = combineMatrix(fullMatrix, transformationToMatrix('rotate', [-toDegrees(rotate)]));
    }
    if (xSkew) {
        fullMatrix = combineMatrix(fullMatrix, transformationToMatrix('skewX', [toDegrees(xSkew)]));
    }
    if (ySkew) {
        fullMatrix = combineMatrix(fullMatrix, transformationToMatrix('skewY', [-toDegrees(ySkew)]));
    }
    // move the rectangle upward so that the (x, y) coord is bottom-left
    fullMatrix = combineMatrix(fullMatrix, transformationToMatrix('translateY', [-h]));
    return drawSvgPath(d, Object.assign(Object.assign({}, options), { x: 0, y: 0, rotate: degrees(0), scale: 1, matrix: fullMatrix }));
};
export const drawEllipse = (options) => {
    const xScale = asNumber(options.xScale);
    const yScale = asNumber(options.yScale);
    const x = asNumber(options.x);
    const y = asNumber(options.y);
    const KAPPA = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);
    const ox = xScale * KAPPA;
    const oy = yScale * KAPPA;
    // Path en sens mathématique (y vers le haut)
    const d = [
        `M 0,${yScale}`,
        `C ${ox},${yScale} ${xScale},${oy} ${xScale},0`,
        `C ${xScale},${-oy} ${ox},${-yScale} 0,${-yScale}`,
        `C ${-ox},${-yScale} ${-xScale},${-oy} ${-xScale},0`,
        `C ${-xScale},${oy} ${-ox},${yScale} 0,${yScale}`,
        'Z',
    ].join(' ');
    let fullMatrix = combineMatrix(options.matrix || identityMatrix, transformationToMatrix('translate', [x, -y]));
    if (options.rotate) {
        fullMatrix = combineMatrix(fullMatrix, transformationToMatrix('rotate', [-toDegrees(options.rotate)]));
    }
    return drawSvgPath(d, Object.assign(Object.assign({}, options), { x: 0, y: 0, rotate: degrees(0), scale: 1, matrix: fullMatrix }));
};
export const drawSvgPath = (path, options) => {
    var _a, _b, _c;
    const drawingOperator = getDrawingOperator(options);
    if (!drawingOperator) {
        // no-op when there is no fill and no border color/width.
        return [];
    }
    return [
        pushGraphicsState(),
        options.graphicsState && setGraphicsState(options.graphicsState),
        ...(options.clipSpaces ? clipSpaces(options.clipSpaces) : []),
        options.matrix && concatTransformationMatrix(...options.matrix),
        translate(options.x, options.y),
        rotateRadians(toRadians((_a = options.rotate) !== null && _a !== void 0 ? _a : degrees(0))),
        // SVG path Y axis is opposite pdf-lib's
        options.scale ? scale(options.scale, -options.scale) : scale(1, -1),
        options.color && setFillingColor(options.color),
        options.borderColor && setStrokingColor(options.borderColor),
        options.borderWidth && setLineWidth(options.borderWidth),
        options.borderLineCap && setLineCap(options.borderLineCap),
        setDashPattern((_b = options.borderDashArray) !== null && _b !== void 0 ? _b : [], (_c = options.borderDashPhase) !== null && _c !== void 0 ? _c : 0),
        ...svgPathToOperators(path),
        drawingOperator(),
        popGraphicsState(),
    ].filter(Boolean);
};
export const drawCheckMark = (options) => {
    const size = asNumber(options.size);
    /*********************** Define Check Mark Points ***************************/
    // A check mark is defined by three points in some coordinate space. Here, we
    // define these points in a unit coordinate system, where the range of the x
    // and y axis are both [-1, 1].
    //
    // Note that we do not hard code `p1y` in case we wish to change the
    // size/shape of the check mark in the future. We want the check mark to
    // always form a right angle. This means that the dot product between (p1-p2)
    // and (p3-p2) should be zero:
    //
    //   (p1x-p2x) * (p3x-p2x) + (p1y-p2y) * (p3y-p2y) = 0
    //
    // We can now rejigger this equation to solve for `p1y`:
    //
    //   (p1y-p2y) * (p3y-p2y) = -((p1x-p2x) * (p3x-p2x))
    //   (p1y-p2y) = -((p1x-p2x) * (p3x-p2x)) / (p3y-p2y)
    //   p1y = -((p1x-p2x) * (p3x-p2x)) / (p3y-p2y) + p2y
    //
    // Thanks to my friend Joel Walker (https://github.com/JWalker1995) for
    // devising the above equation and unit coordinate system approach!
    // (x, y) coords of the check mark's bottommost point
    const p2x = -1 + 0.75;
    const p2y = -1 + 0.51;
    // (x, y) coords of the check mark's topmost point
    const p3y = 1 - 0.525;
    const p3x = 1 - 0.31;
    // (x, y) coords of the check mark's center (vertically) point
    const p1x = -1 + 0.325;
    const p1y = -((p1x - p2x) * (p3x - p2x)) / (p3y - p2y) + p2y;
    /****************************************************************************/
    return [
        pushGraphicsState(),
        options.color && setStrokingColor(options.color),
        setLineWidth(options.thickness),
        translate(options.x, options.y),
        moveTo(p1x * size, p1y * size),
        lineTo(p2x * size, p2y * size),
        lineTo(p3x * size, p3y * size),
        stroke(),
        popGraphicsState(),
    ].filter(Boolean);
};
// prettier-ignore
export const rotateInPlace = (options) => options.rotation === 0 ? [
    translate(0, 0),
    rotateDegrees(0)
]
    : options.rotation === 90 ? [
        translate(options.width, 0),
        rotateDegrees(90)
    ]
        : options.rotation === 180 ? [
            translate(options.width, options.height),
            rotateDegrees(180)
        ]
            : options.rotation === 270 ? [
                translate(0, options.height),
                rotateDegrees(270)
            ]
                : []; // Invalid rotation - noop
export const drawCheckBox = (options) => {
    const outline = drawRectangle({
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
        borderWidth: options.borderWidth,
        color: options.color,
        borderColor: options.borderColor,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
    });
    if (!options.filled)
        return outline;
    const width = asNumber(options.width);
    const height = asNumber(options.height);
    const checkMarkSize = Math.min(width, height) / 2;
    const checkMark = drawCheckMark({
        x: width / 2,
        y: height / 2,
        size: checkMarkSize,
        thickness: options.thickness,
        color: options.markColor,
    });
    return [pushGraphicsState(), ...outline, ...checkMark, popGraphicsState()];
};
export const drawRadioButton = (options) => {
    const width = asNumber(options.width);
    const height = asNumber(options.height);
    const outlineScale = Math.min(width, height) / 2;
    const outline = drawEllipse({
        x: options.x,
        y: options.y,
        xScale: outlineScale,
        yScale: outlineScale,
        color: options.color,
        borderColor: options.borderColor,
        borderWidth: options.borderWidth,
    });
    if (!options.filled)
        return outline;
    const dot = drawEllipse({
        x: options.x,
        y: options.y,
        xScale: outlineScale * 0.45,
        yScale: outlineScale * 0.45,
        color: options.dotColor,
        borderColor: undefined,
        borderWidth: 0,
    });
    return [pushGraphicsState(), ...outline, ...dot, popGraphicsState()];
};
export const drawButton = (options) => {
    const x = asNumber(options.x);
    const y = asNumber(options.y);
    const width = asNumber(options.width);
    const height = asNumber(options.height);
    const background = drawRectangle({
        x,
        y,
        width,
        height,
        borderWidth: options.borderWidth,
        color: options.color,
        borderColor: options.borderColor,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
    });
    const lines = drawTextLines(options.textLines, {
        color: options.textColor,
        font: options.font,
        size: options.fontSize,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
    });
    return [pushGraphicsState(), ...background, ...lines, popGraphicsState()];
};
export const drawTextLines = (lines, options) => {
    const operators = [
        beginText(),
        setFillingColor(options.color),
        setFontAndSize(options.font, options.size),
    ];
    for (let idx = 0, len = lines.length; idx < len; idx++) {
        const { encoded, x, y } = lines[idx];
        operators.push(rotateAndSkewTextRadiansAndTranslate(toRadians(options.rotate), toRadians(options.xSkew), toRadians(options.ySkew), x, y), showText(encoded));
    }
    operators.push(endText());
    return operators;
};
export const drawTextField = (options) => {
    const x = asNumber(options.x);
    const y = asNumber(options.y);
    const width = asNumber(options.width);
    const height = asNumber(options.height);
    const borderWidth = asNumber(options.borderWidth);
    const padding = asNumber(options.padding);
    const clipX = x + borderWidth / 2 + padding;
    const clipY = y + borderWidth / 2 + padding;
    const clipWidth = width - (borderWidth / 2 + padding) * 2;
    const clipHeight = height - (borderWidth / 2 + padding) * 2;
    const clippingArea = [
        moveTo(clipX, clipY),
        lineTo(clipX, clipY + clipHeight),
        lineTo(clipX + clipWidth, clipY + clipHeight),
        lineTo(clipX + clipWidth, clipY),
        closePath(),
        clip(),
        endPath(),
    ];
    const background = drawRectangle({
        x,
        y,
        width,
        height,
        borderWidth: options.borderWidth,
        color: options.color,
        borderColor: options.borderColor,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
    });
    const lines = drawTextLines(options.textLines, {
        color: options.textColor,
        font: options.font,
        size: options.fontSize,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
    });
    const markedContent = [
        beginMarkedContent('Tx'),
        pushGraphicsState(),
        ...lines,
        popGraphicsState(),
        endMarkedContent(),
    ];
    return [
        pushGraphicsState(),
        ...background,
        ...clippingArea,
        ...markedContent,
        popGraphicsState(),
    ];
};
export const drawOptionList = (options) => {
    const x = asNumber(options.x);
    const y = asNumber(options.y);
    const width = asNumber(options.width);
    const height = asNumber(options.height);
    const lineHeight = asNumber(options.lineHeight);
    const borderWidth = asNumber(options.borderWidth);
    const padding = asNumber(options.padding);
    const clipX = x + borderWidth / 2 + padding;
    const clipY = y + borderWidth / 2 + padding;
    const clipWidth = width - (borderWidth / 2 + padding) * 2;
    const clipHeight = height - (borderWidth / 2 + padding) * 2;
    const clippingArea = [
        moveTo(clipX, clipY),
        lineTo(clipX, clipY + clipHeight),
        lineTo(clipX + clipWidth, clipY + clipHeight),
        lineTo(clipX + clipWidth, clipY),
        closePath(),
        clip(),
        endPath(),
    ];
    const background = drawRectangle({
        x,
        y,
        width,
        height,
        borderWidth: options.borderWidth,
        color: options.color,
        borderColor: options.borderColor,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
    });
    const highlights = [];
    for (let idx = 0, len = options.selectedLines.length; idx < len; idx++) {
        const line = options.textLines[options.selectedLines[idx]];
        highlights.push(...drawRectangle({
            x: line.x - padding,
            y: line.y - (lineHeight - line.height) / 2,
            width: width - borderWidth,
            height: line.height + (lineHeight - line.height) / 2,
            borderWidth: 0,
            color: options.selectedColor,
            borderColor: undefined,
            rotate: degrees(0),
            xSkew: degrees(0),
            ySkew: degrees(0),
        }));
    }
    const lines = drawTextLines(options.textLines, {
        color: options.textColor,
        font: options.font,
        size: options.fontSize,
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0),
    });
    const markedContent = [
        beginMarkedContent('Tx'),
        pushGraphicsState(),
        ...lines,
        popGraphicsState(),
        endMarkedContent(),
    ];
    return [
        pushGraphicsState(),
        ...background,
        ...highlights,
        ...clippingArea,
        ...markedContent,
        popGraphicsState(),
    ];
};
const getDrawingOperator = ({ color, borderWidth, borderColor, fillRule, }) => {
    if (color && borderColor && borderWidth !== 0) {
        return fillAndStroke;
    }
    else if (color) {
        return fillRule === FillRule.EvenOdd ? fillEvenOdd : fill;
    }
    else if (borderColor && borderWidth !== 0) {
        return stroke;
    }
    return undefined;
};
//# sourceMappingURL=operations.js.map