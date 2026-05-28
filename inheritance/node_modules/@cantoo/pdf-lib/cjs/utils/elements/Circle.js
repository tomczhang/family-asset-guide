"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const maths_1 = require("../maths");
const GraphElement_1 = tslib_1.__importDefault(require("./GraphElement"));
const Point_1 = tslib_1.__importDefault(require("./Point"));
class Circle extends GraphElement_1.default {
    constructor(O = new Point_1.default(), r = 1) {
        super();
        this.O = O;
        this.r = r;
    }
    ray() {
        return this.r;
    }
    center() {
        return this.O;
    }
    /** This is used to standardize type Circle | Arc */
    getCircle() {
        return this;
    }
    isEqual(element) {
        return (element instanceof Circle &&
            this.center().isEqual(element.center()) &&
            (0, maths_1.isEqual)(this.ray(), element.ray()));
    }
    includes(P) {
        return (0, maths_1.isEqual)((0, maths_1.distance)(this.center(), P), this.ray());
    }
    orthoProjection(P) {
        const center = this.center().toCoords();
        const coords = P.toCoords();
        if ((0, maths_1.distanceCoords)(coords, center) < this.ray())
            return P;
        const vect = (0, maths_1.times)((0, maths_1.unitVector)((0, maths_1.minus)(coords, center)), this.ray());
        return new Point_1.default((0, maths_1.plus)(center, vect));
    }
}
exports.default = Circle;
//# sourceMappingURL=Circle.js.map