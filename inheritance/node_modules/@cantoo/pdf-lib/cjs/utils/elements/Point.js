"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const maths_1 = require("../maths");
const GraphElement_1 = tslib_1.__importDefault(require("./GraphElement"));
class Point extends GraphElement_1.default {
    constructor(coords = { x: 0, y: 0 }) {
        super();
        this.x = coords.x;
        this.y = coords.y;
    }
    toCoords() {
        return { x: this.x, y: this.y };
    }
    isEqual(element) {
        if (!(element instanceof Point))
            return false;
        const A = this.toCoords();
        const B = element.toCoords();
        return (0, maths_1.isEqual)(A.x, B.x) && (0, maths_1.isEqual)(A.y, B.y);
    }
    orthoProjection() {
        return new Point(this.toCoords());
    }
    plus(vect) {
        const P = new Point((0, maths_1.plus)(this.toCoords(), vect));
        return P;
    }
}
exports.default = Point;
Point.type = 'PointFixed';
//# sourceMappingURL=Point.js.map