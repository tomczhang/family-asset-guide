import { HTMLElement } from 'node-html-better-parser';
import { Color } from './colors';
import { Degrees } from './rotations';
import PDFPage from './PDFPage';
import PDFSvg from './PDFSvg';
import { BlendMode, PDFPageDrawSVGElementOptions } from './PDFPageOptions';
import { LineCapStyle, LineJoinStyle, FillRule } from './operators';
import { TransformationMatrix } from '../types/matrix';
import { Space } from '../types';
interface Position {
    x: number;
    y: number;
}
interface Size {
    width: number;
    height: number;
}
type Box = Position & Size;
type InheritedAttributes = {
    width: number;
    height: number;
    fill?: Color;
    fillOpacity?: number;
    stroke?: Color;
    strokeWidth?: number;
    strokeOpacity?: number;
    strokeLineCap?: LineCapStyle;
    fillRule?: FillRule;
    strokeLineJoin?: LineJoinStyle;
    fontFamily?: string;
    fontStyle?: string;
    fontWeight?: string;
    fontSize?: number;
    rotation?: Degrees;
    viewBox: Box;
    blendMode?: BlendMode;
};
type SVGAttributes = {
    rotate?: Degrees;
    scale?: number;
    skewX?: Degrees;
    skewY?: Degrees;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    cx?: number;
    cy?: number;
    r?: number;
    rx?: number;
    ry?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    d?: string;
    src?: string;
    textAnchor?: string;
    preserveAspectRatio?: string;
    strokeWidth?: number;
    dominantBaseline?: 'auto' | 'text-bottom' | 'alphabetic' | 'ideographic' | 'middle' | 'central' | 'mathematical' | 'hanging' | 'text-top' | 'use-script' | 'no-change' | 'reset-size' | 'text-after-edge' | 'text-before-edge';
    points?: string;
};
type TransformAttributes = {
    matrix: TransformationMatrix;
    clipSpaces: Space[];
};
export type SVGElement = HTMLElement & {
    svgAttributes: InheritedAttributes & SVGAttributes & TransformAttributes;
};
export declare const combineMatrix: ([a, b, c, d, e, f]: TransformationMatrix, [a2, b2, c2, d2, e2, f2]: TransformationMatrix) => TransformationMatrix;
type TransformationName = 'scale' | 'scaleX' | 'scaleY' | 'translate' | 'translateX' | 'translateY' | 'rotate' | 'skewX' | 'skewY' | 'matrix';
export declare const transformationToMatrix: (name: TransformationName, args: number[]) => TransformationMatrix;
export declare const drawSvg: (page: PDFPage, svg: PDFSvg | string, options: PDFPageDrawSVGElementOptions) => void;
export {};
//# sourceMappingURL=svg.d.ts.map
