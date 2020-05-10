import * as MapConstants from './MapConstants.js';
import { getTileFlag } from './MapUtils.js';

export class Entity {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
    }

    canMoveEast(x, y) {
        return (
            (getTileFlag(x + 1, y) &
                (MapConstants.MOVE_WEST_MASK | MapConstants.MOVE_FULL_MASK)) ===
            0
        );
    }
    canMoveWest(x, y) {
        return (
            (getTileFlag(x - 1, y) &
                (MapConstants.MOVE_EAST_MASK | MapConstants.MOVE_FULL_MASK)) ===
            0
        );
    }
    canMoveNorth(x, y) {
        return (
            (getTileFlag(x, y + 1) &
                (MapConstants.MOVE_SOUTH_MASK |
                    MapConstants.MOVE_FULL_MASK)) ===
            0
        );
    }
    canMoveSouth(x, y) {
        return (
            (getTileFlag(x, y - 1) &
                (MapConstants.MOVE_NORTH_MASK |
                    MapConstants.MOVE_FULL_MASK)) ===
            0
        );
    }

    hasLineOfSight(x1, y1, x2, y2) {
        let dx = x2 - x1;
        let dxAbs = Math.abs(dx);
        let dy = y2 - y1;
        let dyAbs = Math.abs(dy);
        if (dxAbs > dyAbs) {
            let xTile = x1;
            let y = y1 << 16;
            let slope = Math.trunc((dy << 16) / dxAbs);
            let xInc;
            let xMask;
            if (dx > 0) {
                xInc = 1;
                xMask = MapConstants.LOS_WEST_MASK | MapConstants.LOS_FULL_MASK;
            } else {
                xInc = -1;
                xMask = MapConstants.LOS_EAST_MASK | MapConstants.LOS_FULL_MASK;
            }
            let yMask;
            y += 0x8000;
            if (dy < 0) {
                y -= 1;
                yMask =
                    MapConstants.LOS_NORTH_MASK | MapConstants.LOS_FULL_MASK;
            } else {
                yMask =
                    MapConstants.LOS_SOUTH_MASK | MapConstants.LOS_FULL_MASK;
            }
            while (xTile !== x2) {
                xTile += xInc;
                let yTile = y >>> 16;
                if ((getTileFlag(xTile, yTile) & xMask) !== 0) {
                    return false;
                }
                y += slope;
                let newYTile = y >>> 16;
                if (
                    newYTile !== yTile &&
                    (getTileFlag(xTile, newYTile) & yMask) !== 0
                ) {
                    return false;
                }
            }
        } else {
            let yTile = y1;
            let x = x1 << 16;
            let slope = Math.trunc((dx << 16) / dyAbs);
            let yInc;
            let yMask;
            if (dy > 0) {
                yInc = 1;
                yMask =
                    MapConstants.LOS_SOUTH_MASK | MapConstants.LOS_FULL_MASK;
            } else {
                yInc = -1;
                yMask =
                    MapConstants.LOS_NORTH_MASK | MapConstants.LOS_FULL_MASK;
            }
            let xMask;
            x += 0x8000;
            if (dx < 0) {
                x -= 1;
                xMask = MapConstants.LOS_EAST_MASK | MapConstants.LOS_FULL_MASK;
            } else {
                xMask = MapConstants.LOS_WEST_MASK | MapConstants.LOS_FULL_MASK;
            }
            while (yTile !== y2) {
                yTile += yInc;
                let xTile = x >>> 16;
                if ((getTileFlag(xTile, yTile) & yMask) !== 0) {
                    return false;
                }
                x += slope;
                let newXTile = x >>> 16;
                if (
                    newXTile !== xTile &&
                    (getTileFlag(newXTile, yTile) & xMask) !== 0
                ) {
                    return false;
                }
            }
        }
        return true;
    }
}
