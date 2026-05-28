import { isEqual, plus } from '../maths.js';
import GraphElement from './GraphElement.js';
export default class Point extends GraphElement {
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
        return isEqual(A.x, B.x) && isEqual(A.y, B.y);
    }
    orthoProjection() {
        return new Point(this.toCoords());
    }
    plus(vect) {
        const P = new Point(plus(this.toCoords(), vect));
        return P;
    }
}
Point.type = 'PointFixed';
//# sourceMappingURL=Point.js.map