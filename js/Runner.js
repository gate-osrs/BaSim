import * as Constants from './Constants.js';
import { Entity } from './Entity.js';
import {
    getItemZone,
    getPlayerPosition,
    getCollPosition,
    getItemZonesWidth,
    getItemZonesHeight,
} from './MapUtils.js';

let ruSniffDistance = 5;

export class Runner extends Entity {
    constructor(x, y, runnerRNG, isWave10, id) {
        super(x, y, id);
        this.x = x;
        this.y = y;
        this.destinationX = x;
        this.destinationY = y;
        this.id = id;
        this.cycleTick = 1;
        this.targetState = 0;
        this.foodTarget = null;
        this.blughhhhCountdown = 0;
        this.standStillCounter = 0;
        this.despawnCountdown = -1;
        this.isDying = false;
        this.runnerRNG = runnerRNG;
        this.isWave10 = isWave10;
        this.remove = false;
        this.dead = false;
    }

    static setSniffDistance(sniffDistance) {
        ruSniffDistance = sniffDistance;
    }

    tick() {
        if (++this.cycleTick > 10) {
            this.cycleTick = 1;
        }
        ++this.standStillCounter;
        if (this.despawnCountdown !== -1) {
            if (--this.despawnCountdown === 0) {
                this.remove = true;
            }
        } else {
            if (!this.isDying) {
                switch (this.cycleTick) {
                    case 1:
                        this.doTick1();
                        break;
                    case 2:
                        this.doTick2Or5();
                        break;
                    case 3:
                        this.doTick3();
                        break;
                    case 4:
                        this.doTick4();
                        break;
                    case 5:
                        this.doTick2Or5();
                        break;
                    case 6:
                        this.doTick6();
                        break;
                    case 7:
                    case 8:
                    case 9:
                    case 10:
                        this.doTick7To10();
                        break;
                }
            }
            if (this.isDying) {
                if (this.standStillCounter > 2) {
                    this.dead = true;
                    this.print('Urghhh!');
                    this.despawnCountdown = 2;
                }
            }
        }
    }

    doMovement() {
        // TODO: Doesn't consider diagonal movement block flags
        let startX = this.x;
        if (this.destinationX > startX) {
            if (
                !this.baTileBlocksPenance(startX + 1, this.y) &&
                this.canMoveEast(startX, this.y)
            ) {
                ++this.x;
                this.standStillCounter = 0;
            }
        } else if (
            this.destinationX < startX &&
            !this.baTileBlocksPenance(startX - 1, this.y) &&
            this.canMoveWest(startX, this.y)
        ) {
            --this.x;
            this.standStillCounter = 0;
        }
        if (this.destinationY > this.y) {
            if (
                !this.baTileBlocksPenance(startX, this.y + 1) &&
                !this.baTileBlocksPenance(this.x, this.y + 1) &&
                this.canMoveNorth(startX, this.y) &&
                this.canMoveNorth(this.x, this.y)
            ) {
                ++this.y;
                this.standStillCounter = 0;
            }
        } else if (
            this.destinationY < this.y &&
            !this.baTileBlocksPenance(startX, this.y - 1) &&
            !this.baTileBlocksPenance(this.x, this.y - 1) &&
            this.canMoveSouth(startX, this.y) &&
            this.canMoveSouth(this.x, this.y)
        ) {
            --this.y;
            this.standStillCounter = 0;
        }
    }

    tryTargetFood() {
        let xZone = this.x >> 3;
        let yZone = this.y >> 3;
        let firstFoodFound = null;
        let endXZone = Math.max(xZone - 1, 0);
        let endYZone = Math.max(yZone - 1, 0);
        for (
            let x = Math.min(xZone + 1, getItemZonesWidth() - 1);
            x >= endXZone;
            --x
        ) {
            for (
                let y = Math.min(yZone + 1, getItemZonesHeight() - 1);
                y >= endYZone;
                --y
            ) {
                let itemZone = getItemZone(x, y);
                for (
                    let foodIndex = itemZone.length - 1;
                    foodIndex >= 0;
                    --foodIndex
                ) {
                    let food = itemZone[foodIndex];
                    if (!this.hasLineOfSight(this.x, this.y, food.x, food.y)) {
                        continue;
                    }
                    if (firstFoodFound === null) {
                        firstFoodFound = food;
                    }
                    if (
                        Math.max(
                            Math.abs(this.x - food.x),
                            Math.abs(this.y - food.y)
                        ) <= ruSniffDistance
                    ) {
                        this.foodTarget = firstFoodFound;
                        this.destinationX = firstFoodFound.x;
                        this.destinationY = firstFoodFound.y;
                        this.targetState = 0;
                        return;
                    }
                }
            }
        }
    }

    tryEatAndCheckTarget() {
        if (this.foodTarget !== null) {
            let itemZone = getItemZone(
                this.foodTarget.x >>> 3,
                this.foodTarget.y >>> 3
            );
            let foodIndex = itemZone.indexOf(this.foodTarget);
            if (foodIndex === -1) {
                this.foodTarget = null;
                this.targetState = 0;
                return true;
            } else if (
                this.x === this.foodTarget.x &&
                this.y === this.foodTarget.y
            ) {
                if (this.foodTarget.isGood) {
                    this.print('Chomp, chomp.');
                    if (this.isNearTrap()) {
                        this.isDying = true;
                    }
                } else {
                    this.print('Blughhhh.');
                    this.blughhhhCountdown = 3;
                    this.targetState = 0;
                    if (this.cycleTick > 5) {
                        this.cycleTick -= 5;
                    }
                    this.setDestinationBlughhhh();
                }
                itemZone.splice(foodIndex, 1);
                return true;
            }
        }
        return false;
    }

    cancelDestination() {
        this.destinationX = this.x;
        this.destinationY = this.y;
    }

    setDestinationBlughhhh() {
        this.destinationX = this.x;
        if (this.isWave10) {
            this.destinationY = Constants.EAST_TRAP_Y - 4;
        } else {
            this.destinationY = Constants.EAST_TRAP_Y + 4;
        }
    }

    setDestinationRandomWalk() {
        if (this.x <= 27) {
            // TODO: These same for wave 10?
            if (this.y === 8 || this.y === 9) {
                this.destinationX = 30;
                this.destinationY = 8;
                return;
            } else if (this.x === 25 && this.y === 7) {
                this.destinationX = 26;
                this.destinationY = 8;
                return;
            }
        } else if (this.x <= 32) {
            if (this.y <= 8) {
                this.destinationX = 30;
                this.destinationY = 6;
                return;
            }
        } else if (this.y === 7 || this.y === 8) {
            this.destinationX = 31;
            this.destinationY = 8;
            return;
        }
        let direction = this.runnerRNG.rollMovement();
        if (direction === Constants.rngSOUTH) {
            this.destinationX = this.x;
            this.destinationY = this.y - 5;
        } else if (direction === Constants.rngWEST) {
            this.destinationX = this.x - 5;
            if (this.destinationX < Constants.WEST_TRAP_X - 1) {
                // TODO: Same for wave 10?
                this.destinationX = Constants.WEST_TRAP_X - 1;
            }
            this.destinationY = this.y;
        } else {
            this.destinationX = this.x + 5;
            if (this.isWave10) {
                if (this.destinationX > Constants.EAST_TRAP_X - 1) {
                    this.destinationX = Constants.EAST_TRAP_X - 1;
                }
            } else if (this.destinationX > Constants.EAST_TRAP_X) {
                this.destinationX = Constants.EAST_TRAP_X;
            }
            this.destinationY = this.y;
        }
    }

    doTick1() {
        if (this.y === 6) {
            this.despawnCountdown = 3;
            this.print('Raaa!');
            return;
        }
        if (this.blughhhhCountdown > 0) {
            --this.blughhhhCountdown;
        } else {
            ++this.targetState;
            if (this.targetState > 3) {
                this.targetState = 1;
            }
        }
        let ateOrTargetGone = this.tryEatAndCheckTarget();
        if (this.blughhhhCountdown === 0 && this.foodTarget === null) {
            // Could make this line same as tick 6 without any difference?
            this.cancelDestination();
        }
        if (!ateOrTargetGone) {
            this.doMovement();
        }
    }

    doTick2Or5() {
        if (this.targetState === 2) {
            this.tryTargetFood();
        }
        this.doTick7To10();
    }

    doTick3() {
        if (this.targetState === 3) {
            this.tryTargetFood();
        }
        this.doTick7To10();
    }

    doTick4() {
        if (this.targetState === 1) {
            this.tryTargetFood();
        }
        this.doTick7To10();
    }

    doTick6() {
        if (this.y === 6) {
            this.despawnCountdown = 3;
            this.print('Raaa!');
            return;
        }
        if (this.blughhhhCountdown > 0) {
            --this.blughhhhCountdown;
        }
        if (this.targetState === 3) {
            this.tryTargetFood();
        }
        let ateOrTargetGone = this.tryEatAndCheckTarget();
        if (
            this.blughhhhCountdown === 0 &&
            (this.foodTarget === null || ateOrTargetGone)
        ) {
            this.setDestinationRandomWalk();
        }
        if (!ateOrTargetGone) {
            this.doMovement();
        }
    }

    doTick7To10() {
        let ateOrTargetGone = this.tryEatAndCheckTarget();
        if (!ateOrTargetGone) {
            this.doMovement();
        }
    }

    baTileBlocksPenance(x, y) {
        // TODO: comment these constants
        const { x: plX, y: plY } = getPlayerPosition();
        const { x: collX, y: collY } = getCollPosition();
        if (x === plX && y === plY) {
            return true;
        }
        if (x === collX && y === collY) {
            return true;
        }
        if (y === 22) {
            if (x >= 20 && x <= 22) {
                return true;
            }
            if (window.settings.wave < 10 && x >= 39 && x <= 41) {
                return true;
            }
        } else if (x === 46 && y >= 9 && y <= 12) {
            return true;
        } else if (window.settings.wave < 10 && x === 27 && y === 24) {
            return true;
        }
        return false;
    }

    isNearTrap() {
        return (
            (Math.abs(this.x - Constants.EAST_TRAP_X) < 2 &&
                Math.abs(this.y - Constants.EAST_TRAP_Y) < 2) ||
            (Math.abs(this.x - Constants.WEST_TRAP_X) < 2 &&
                Math.abs(this.y - Constants.WEST_TRAP_Y) < 2)
        );
    }

    print(s) {
        console.log(': Runner ' + this.id + ': ' + s);
    }
}
