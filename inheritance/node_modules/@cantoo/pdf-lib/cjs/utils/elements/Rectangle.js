"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const GraphElement_1 = tslib_1.__importDefault(require("./GraphElement"));
const Point_1 = tslib_1.__importDefault(require("./Point"));
const Segment_1 = tslib_1.__importDefault(require("./Segment"));
class Rectangle extends GraphElement_1.default {
    constructor(start = new Point_1.default(), end = new Point_1.default()) {
        super();
        this.start = start;
        this.end = end;
    }
    getSize() {
        const start = this.start.toCoords();
        const end = this.end.toCoords();
        return {
            width: Math.abs(start.x - end.x),
            height: Math.abs(start.y - end.y),
        };
    }
    getCoords() {
        const start = this.start.toCoords();
        const end = this.end.toCoords();
        return {
            x: Math.min(start.x, end.x),
            y: Math.max(start.y, end.y),
        };
    }
    getStart() {
        const start = new Point_1.default(this.getCoords());
        return start;
    }
    getEnd() {
        const { width, height } = this.getSize();
        const end = new Point_1.default(this.getStart()).plus({ x: width, y: -height });
        return end;
    }
    center() {
        const center = new Segment_1.default(this.getStart(), this.getEnd()).middle();
        return center;
    }
    isEqual(element) {
        return (element instanceof Rectangle &&
            this.getStart().isEqual(element.getStart()) &&
            this.getEnd().isEqual(element.getEnd()));
    }
    orthoProjection(P) {
        const { x, y } = this.getCoords();
        const end = this.getEnd().toCoords();
        const { x: Px, y: Py } = P.toCoords();
        const Hx = Px < x ? x : Px > end.x ? end.x : Px;
        const Hy = Py > y ? y : Py < end.y ? end.y : Py;
        return new Point_1.default({ x: Hx, y: Hy });
    }
}
exports.default = Rectangle;
Rectangle.type = 'Rectangle';
//# sourceMappingURL=Rectangle.js.map