import { mWAVE_1_TO_9, mWAVE10 } from './MapConstants.js';
import { Runner } from './Runner.js';
import { setPlayerPosition, addItem, resetMap } from './MapUtils.js';
import { Canvas } from './Canvas.js';
import * as Constants from './Constants.js';

const HTML_CANVAS = 'basimcanvas';
const HTML_RUNNER_MOVEMENTS = 'runnermovements';
const HTML_START_BUTTON = 'wavestart';
const HTML_WAVE_SELECT = 'waveselect';
const HTML_TICK_COUNT = 'tickcount';
const HTML_DEF_LEVEL_SELECT = 'deflevelselect';
window.onload = simInit;
var canvasRenderer;

function simInit() {
    window.settings = {
        wave: 1,
        defenderLevel: 5,
    };
    let canvas = document.getElementById(HTML_CANVAS);
    simMovementsInput = document.getElementById(HTML_RUNNER_MOVEMENTS);
    simMovementsInput.onkeypress = function (e) {
        if (e.key === ' ') {
            e.preventDefault();
        }
    };
    simStartStopButton = document.getElementById(HTML_START_BUTTON);
    simStartStopButton.onclick = simStartStopButtonOnClick;
    simWaveSelect = document.getElementById(HTML_WAVE_SELECT);
    simWaveSelect.onchange = simWaveSelectOnChange;
    simDefLevelSelect = document.getElementById(HTML_DEF_LEVEL_SELECT);
    simDefLevelSelect.onchange = simDefLevelSelectOnChange;
    simTickCountSpan = document.getElementById(HTML_TICK_COUNT);
    // rInit(canvas, 64 * 12, 48 * 12);
    canvasRenderer = new Canvas(canvas, 64 * 12, 48 * 12);
    mInit(mWAVE_1_TO_9, 64, 48);
    Runner.setSniffDistance(5);
    simReset();
    window.onkeydown = simWindowOnKeyDown;
    canvas.onmousedown = simCanvasOnMouseDown;
    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };
}

// resets
function simReset() {
    if (simIsRunning) {
        clearInterval(simTickTimerId);
    }
    simIsRunning = false;
    simStartStopButton.innerHTML = 'Start Wave';
    baInit(0, 0, '');
    plInit(-1, 0);
    simDraw();
}

// starts/stops the sim
function simStartStopButtonOnClick() {
    if (simIsRunning) {
        // stop
        mResetMap();
        simReset();
    } else {
        // start
        let movements = simParseMovementsInput();
        if (movements === null) {
            alert('Invalid runner movements. Example: ws-s');
            return;
        }
        simIsRunning = true;
        simStartStopButton.innerHTML = 'Stop Wave';
        let maxRunnersAlive = 0;
        let totalRunners = 0;
        let wave = simWaveSelect.value;
        switch (Number(wave)) {
            case 1:
                maxRunnersAlive = 2;
                totalRunners = 2;
                break;
            case 2:
                maxRunnersAlive = 2;
                totalRunners = 3;
                break;
            case 3:
                maxRunnersAlive = 2;
                totalRunners = 4;
                break;
            case 4:
                maxRunnersAlive = 3;
                totalRunners = 4;
                break;
            case 5:
                maxRunnersAlive = 4;
                totalRunners = 5;
                break;
            case 6:
                maxRunnersAlive = 4;
                totalRunners = 6;
                break;
            case 7:
            case 10:
                maxRunnersAlive = 5;
                totalRunners = 6;
                break;
            case 8:
                maxRunnersAlive = 5;
                totalRunners = 7;
                break;
            case 9:
                maxRunnersAlive = 5;
                totalRunners = 9;
                break;
        }
        baInit(maxRunnersAlive, totalRunners, movements);
        if (mCurrentMap === mWAVE10) {
            plInit(baWAVE10_DEFENDER_SPAWN_X, baWAVE10_DEFENDER_SPAWN_Y);
        } else {
            plInit(baWAVE1_DEFENDER_SPAWN_X, baWAVE1_DEFENDER_SPAWN_Y);
        }
        console.log('Wave ' + wave + ' started!');
        simTick();
        simTickTimerId = setInterval(simTick, 600);
    }
}
function simParseMovementsInput() {
    let movements = simMovementsInput.value.split('-');
    for (let i = 0; i < movements.length; ++i) {
        let moves = movements[i];
        for (let j = 0; j < moves.length; ++j) {
            let move = moves[j];
            if (move !== '' && move !== 's' && move !== 'w' && move !== 'e') {
                return null;
            }
        }
    }
    return movements;
}
function simWindowOnKeyDown(e) {
    if (simIsRunning) {
        if (e.key === 'r') {
            mAddItem(new fFood(plX, plY, true));
        } else if (e.key === 'w') {
            mAddItem(new fFood(plX, plY, false));
        } else if (e.key === 'e') {
            let itemZone = mGetItemZone(plX >>> 3, plY >>> 3);
            for (let i = 0; i < itemZone.length; ++i) {
                let item = itemZone[i];
                if (plX === item.x && plY === item.y) {
                    itemZone.splice(i, 1);
                    break;
                }
            }
        }
    }
    if (e.key === ' ') {
        simStartStopButtonOnClick();
        e.preventDefault();
    }
}
function simCanvasOnMouseDown(e) {
    var canvasRect = canvasRenderer.canvasEl.getBoundingClientRect();
    let xTile = Math.trunc((e.clientX - canvasRect.left) / Constants.TILE_SIZE);
    let yTile = Math.trunc(
        (canvasRect.bottom - 1 - e.clientY) / Constants.TILE_SIZE
    );
    if (e.button === 0) {
        plPathfind(xTile, yTile);
    } else if (e.button === 2) {
        if (xTile === baCollectorX && yTile === baCollectorY) {
            baCollectorX = -1;
        } else {
            baCollectorX = xTile;
            baCollectorY = yTile;
        }
    }
}
function simWaveSelectOnChange(e) {
    window.wave = Number(simWaveSelect.value);
    if (simWaveSelect.value === '10') {
        mInit(mWAVE10, 64, 48);
    } else {
        mInit(mWAVE_1_TO_9, 64, 48);
    }
    simReset();
}
function simDefLevelSelectOnChange(e) {
    mResetMap();
    simReset();
    window.defenderLevel = Number(simDefLevelSelect.value);
    Runner.setSniffDistance(Number(simDefLevelSelect.value));
}
function simTick() {
    baTick();
    plTick();
    simDraw();
}
function simDraw() {
    mDrawMap();
    baDrawDetails();
    mDrawItems();
    baDrawEntities();
    plDrawPlayer();
    mDrawGrid();
    baDrawOverlays();
    canvasRenderer.present();
}
var simTickTimerId;
var simMovementsInput;
var simStartStopButton;
var simWaveSelect;
var simDefLevelSelect;
var simTickCountSpan;
var simIsRunning;
//}
//{ Player - pl
function plInit(x, y) {
    plX = x;
    plY = y;
    plPathQueuePos = 0;
    plPathQueueX = [];
    plPathQueueY = [];
    plShortestDistances = [];
    plWayPoints = [];
}
function plTick() {
    if (plPathQueuePos > 0) {
        plX = plPathQueueX[--plPathQueuePos];
        plY = plPathQueueY[plPathQueuePos];
        setPlayerPosition(plX, plY); // TEST
        if (plPathQueuePos > 0) {
            plX = plPathQueueX[--plPathQueuePos];
            plY = plPathQueueY[plPathQueuePos];
            setPlayerPosition(plX, plY); // TEST
        }
    }
}
function plDrawPlayer() {
    if (plX >= 0) {
        canvasRenderer.setDrawColor(240, 240, 240, 200);
        rrFill(plX, plY);
    }
}
function plPathfind(destX, destY) {
    for (let i = 0; i < mWidthTiles * mHeightTiles; ++i) {
        plShortestDistances[i] = 99999999;
        plWayPoints[i] = 0;
    }
    plWayPoints[plX + plY * mWidthTiles] = 99;
    plShortestDistances[plX + plY * mWidthTiles] = 0;
    plPathQueuePos = 0;
    let pathQueueEnd = 0;
    plPathQueueX[pathQueueEnd] = plX;
    plPathQueueY[pathQueueEnd++] = plY;
    let currentX;
    let currentY;
    let foundDestination = false;
    while (plPathQueuePos !== pathQueueEnd) {
        currentX = plPathQueueX[plPathQueuePos];
        currentY = plPathQueueY[plPathQueuePos++];
        if (currentX === destX && currentY === destY) {
            foundDestination = true;
            break;
        }
        let newDistance =
            plShortestDistances[currentX + currentY * mWidthTiles] + 1;
        let index = currentX - 1 + currentY * mWidthTiles;
        if (
            currentX > 0 &&
            plWayPoints[index] === 0 &&
            (mCurrentMap[index] & 19136776) === 0
        ) {
            plPathQueueX[pathQueueEnd] = currentX - 1;
            plPathQueueY[pathQueueEnd++] = currentY;
            plWayPoints[index] = 2;
            plShortestDistances[index] = newDistance;
        }
        index = currentX + 1 + currentY * mWidthTiles;
        if (
            currentX < mWidthTiles - 1 &&
            plWayPoints[index] === 0 &&
            (mCurrentMap[index] & 19136896) === 0
        ) {
            plPathQueueX[pathQueueEnd] = currentX + 1;
            plPathQueueY[pathQueueEnd++] = currentY;
            plWayPoints[index] = 8;
            plShortestDistances[index] = newDistance;
        }
        index = currentX + (currentY - 1) * mWidthTiles;
        if (
            currentY > 0 &&
            plWayPoints[index] === 0 &&
            (mCurrentMap[index] & 19136770) === 0
        ) {
            plPathQueueX[pathQueueEnd] = currentX;
            plPathQueueY[pathQueueEnd++] = currentY - 1;
            plWayPoints[index] = 1;
            plShortestDistances[index] = newDistance;
        }
        index = currentX + (currentY + 1) * mWidthTiles;
        if (
            currentY < mHeightTiles - 1 &&
            plWayPoints[index] === 0 &&
            (mCurrentMap[index] & 19136800) === 0
        ) {
            plPathQueueX[pathQueueEnd] = currentX;
            plPathQueueY[pathQueueEnd++] = currentY + 1;
            plWayPoints[index] = 4;
            plShortestDistances[index] = newDistance;
        }
        index = currentX - 1 + (currentY - 1) * mWidthTiles;
        if (
            currentX > 0 &&
            currentY > 0 &&
            plWayPoints[index] === 0 &&
            (mCurrentMap[index] & 19136782) == 0 &&
            (mCurrentMap[currentX - 1 + currentY * mWidthTiles] & 19136776) ===
                0 &&
            (mCurrentMap[currentX + (currentY - 1) * mWidthTiles] &
                19136770) ===
                0
        ) {
            plPathQueueX[pathQueueEnd] = currentX - 1;
            plPathQueueY[pathQueueEnd++] = currentY - 1;
            plWayPoints[index] = 3;
            plShortestDistances[index] = newDistance;
        }
        index = currentX + 1 + (currentY - 1) * mWidthTiles;
        if (
            currentX < mWidthTiles - 1 &&
            currentY > 0 &&
            plWayPoints[index] === 0 &&
            (mCurrentMap[index] & 19136899) == 0 &&
            (mCurrentMap[currentX + 1 + currentY * mWidthTiles] & 19136896) ===
                0 &&
            (mCurrentMap[currentX + (currentY - 1) * mWidthTiles] &
                19136770) ===
                0
        ) {
            plPathQueueX[pathQueueEnd] = currentX + 1;
            plPathQueueY[pathQueueEnd++] = currentY - 1;
            plWayPoints[index] = 9;
            plShortestDistances[index] = newDistance;
        }
        index = currentX - 1 + (currentY + 1) * mWidthTiles;
        if (
            currentX > 0 &&
            currentY < mHeightTiles - 1 &&
            plWayPoints[index] === 0 &&
            (mCurrentMap[index] & 19136824) == 0 &&
            (mCurrentMap[currentX - 1 + currentY * mWidthTiles] & 19136776) ===
                0 &&
            (mCurrentMap[currentX + (currentY + 1) * mWidthTiles] &
                19136800) ===
                0
        ) {
            plPathQueueX[pathQueueEnd] = currentX - 1;
            plPathQueueY[pathQueueEnd++] = currentY + 1;
            plWayPoints[index] = 6;
            plShortestDistances[index] = newDistance;
        }
        index = currentX + 1 + (currentY + 1) * mWidthTiles;
        if (
            currentX < mWidthTiles - 1 &&
            currentY < mHeightTiles - 1 &&
            plWayPoints[index] === 0 &&
            (mCurrentMap[index] & 19136992) == 0 &&
            (mCurrentMap[currentX + 1 + currentY * mWidthTiles] & 19136896) ===
                0 &&
            (mCurrentMap[currentX + (currentY + 1) * mWidthTiles] &
                19136800) ===
                0
        ) {
            plPathQueueX[pathQueueEnd] = currentX + 1;
            plPathQueueY[pathQueueEnd++] = currentY + 1;
            plWayPoints[index] = 12;
            plShortestDistances[index] = newDistance;
        }
    }
    if (!foundDestination) {
        let bestDistanceStart = 0x7fffffff;
        let bestDistanceEnd = 0x7fffffff;
        let deviation = 10;
        for (let x = destX - deviation; x <= destX + deviation; ++x) {
            for (let y = destY - deviation; y <= destY + deviation; ++y) {
                if (x >= 0 && y >= 0 && x < mWidthTiles && y < mHeightTiles) {
                    let distanceStart =
                        plShortestDistances[x + y * mWidthTiles];
                    if (distanceStart < 100) {
                        let dx = Math.max(destX - x);
                        let dy = Math.max(destY - y);
                        let distanceEnd = dx * dx + dy * dy;
                        if (
                            distanceEnd < bestDistanceEnd ||
                            (distanceEnd === bestDistanceEnd &&
                                distanceStart < bestDistanceStart)
                        ) {
                            bestDistanceStart = distanceStart;
                            bestDistanceEnd = distanceEnd;
                            currentX = x;
                            currentY = y;
                            foundDestination = true;
                        }
                    }
                }
            }
        }
        if (!foundDestination) {
            plPathQueuePos = 0;
            return;
        }
    }
    plPathQueuePos = 0;
    while (currentX !== plX || currentY !== plY) {
        let waypoint = plWayPoints[currentX + currentY * mWidthTiles];
        plPathQueueX[plPathQueuePos] = currentX;
        plPathQueueY[plPathQueuePos++] = currentY;
        if ((waypoint & 2) !== 0) {
            ++currentX;
        } else if ((waypoint & 8) !== 0) {
            --currentX;
        }
        if ((waypoint & 1) !== 0) {
            ++currentY;
        } else if ((waypoint & 4) !== 0) {
            --currentY;
        }
    }
}
var plPathQueuePos;
var plShortestDistances;
var plWayPoints;
var plPathQueueX;
var plPathQueueY;
var plX;
var plY;
//}
//{ Food - f
function fFood(x, y, isGood) {
    this.x = x;
    this.y = y;
    this.isGood = isGood;
    if (this.isGood) {
        this.colorRed = 0;
        this.colorGreen = 255;
    } else {
        this.colorRed = 255;
        this.colorGreen = 0;
    }
    this.colorBlue = 0;
}
//}
//{ RunnerRNG - rng
const rngSOUTH = 0;
const rngWEST = 1;
const rngEAST = 2;
function rngRunnerRNG(forcedMovements) {
    this.forcedMovements = forcedMovements;
    this.forcedMovementsIndex = 0;
}
rngRunnerRNG.prototype.rollMovement = function () {
    if (this.forcedMovements.length > this.forcedMovementsIndex) {
        let movement = this.forcedMovements.charAt(this.forcedMovementsIndex++);
        if (movement === 's') {
            return rngSOUTH;
        }
        if (movement === 'w') {
            return rngWEST;
        }
        if (movement === 'e') {
            return rngEAST;
        }
    }
    let rnd = Math.floor(Math.random() * 6);
    if (rnd < 4) {
        return rngSOUTH;
    }
    if (rnd === 4) {
        return rngWEST;
    }
    return rngEAST;
};

//}
//{ BaArena - ba
const baWAVE1_RUNNER_SPAWN_X = 36;
const baWAVE1_RUNNER_SPAWN_Y = 39;
const baWAVE10_RUNNER_SPAWN_X = 42;
const baWAVE10_RUNNER_SPAWN_Y = 38;
const baWAVE1_DEFENDER_SPAWN_X = 33;
const baWAVE1_DEFENDER_SPAWN_Y = 8;
const baWAVE10_DEFENDER_SPAWN_X = 28;
const baWAVE10_DEFENDER_SPAWN_Y = 8;
function baInit(maxRunnersAlive, totalRunners, runnerMovements) {
    baRunners = [];
    baTickCounter = 0;
    baRunnersAlive = 0;
    baRunnersKilled = 0;
    baMaxRunnersAlive = maxRunnersAlive;
    baTotalRunners = totalRunners;
    baCollectorX = -1;
    baRunnerMovements = runnerMovements;
    baRunnerMovementsIndex = 0;
    baCurrentRunnerId = 1;
    simTickCountSpan.innerHTML = baTickCounter;
}
function baTick() {
    ++baTickCounter;
    for (let i = 0; i < baRunners.length; ++i) {
        baRunners[i].tick();
    }
    // kill runners & increment killedRunners count
    const deadRunnersThisWave = baRunners.filter((runner) => !!runner.dead);
    const raadRunnersThisWave = baRunners.filter(
        (runner) => !!runner.remove && !runner.dead
    );
    baRunnersKilled += deadRunnersThisWave.length;
    baRunnersAlive -= deadRunnersThisWave.length;
    baRunnersAlive -= raadRunnersThisWave.length;
    baRunners = baRunners.filter((runner) => !runner.remove);

    if (
        baTickCounter > 1 &&
        baTickCounter % 10 === 1 &&
        baRunnersAlive < baMaxRunnersAlive &&
        baRunnersKilled + baRunnersAlive < baTotalRunners
    ) {
        let movements;
        if (baRunnerMovements.length > baRunnerMovementsIndex) {
            movements = baRunnerMovements[baRunnerMovementsIndex++];
        } else {
            movements = '';
        }
        if (mCurrentMap === mWAVE_1_TO_9) {
            baRunners.push(
                new Runner(
                    baWAVE1_RUNNER_SPAWN_X,
                    baWAVE1_RUNNER_SPAWN_Y,
                    new rngRunnerRNG(movements),
                    false,
                    baCurrentRunnerId++
                )
            );
        } else {
            baRunners.push(
                new Runner(
                    baWAVE10_RUNNER_SPAWN_X,
                    baWAVE10_RUNNER_SPAWN_Y,
                    new rngRunnerRNG(movements),
                    true,
                    baCurrentRunnerId++
                )
            );
        }
        ++baRunnersAlive;
    }
    simTickCountSpan.innerHTML = baTickCounter;
}
function baDrawOverlays() {
    if (mCurrentMap !== mWAVE_1_TO_9 && mCurrentMap !== mWAVE10) {
        return;
    }
    canvasRenderer.setDrawColor(240, 10, 10, 220);
    if (mCurrentMap === mWAVE_1_TO_9) {
        rrOutline(18, 37);
    } else {
        rrOutline(18, 38);
    }
    rrOutline(24, 39);
    rrFill(33, 6);
    canvasRenderer.setDrawColor(10, 10, 240, 220);
    if (mCurrentMap === mWAVE_1_TO_9) {
        rrOutline(36, 39);
    } else {
        rrOutline(42, 38);
    }
    rrFill(34, 6);
    canvasRenderer.setDrawColor(10, 240, 10, 220);
    if (mCurrentMap === mWAVE_1_TO_9) {
        rrOutline(42, 37);
    } else {
        rrOutline(36, 39);
    }
    rrFill(35, 6);
    canvasRenderer.setDrawColor(240, 240, 10, 220);
    rrFill(36, 6);
}
function baDrawDetails() {
    if (mCurrentMap !== mWAVE_1_TO_9 && mCurrentMap !== mWAVE10) {
        return;
    }
    canvasRenderer.setDrawColor(160, 82, 45, 255);
    rrCone(40, 32);
    rrCone(40, 31);
    rrCone(41, 32);
    rrCone(41, 31);
    rrCone(43, 31);
    rrCone(36, 34);
    rrCone(36, 35);
    rrCone(37, 34);
    rrCone(37, 35);
    rrCone(39, 36);
    rrCone(43, 22);
    rrCone(43, 23);
    rrCone(44, 22);
    rrCone(44, 23);
    rrCone(45, 24);
    if (mCurrentMap === mWAVE_1_TO_9) {
        rrFillItem(29, 38);
        rrFillItem(28, 39);
    } else {
        rrFillItem(30, 38);
        rrFillItem(29, 39);
    }
    rrOutline(45, 26);
    rrOutline(15, 25);
    if (mCurrentMap === mWAVE10) {
        rrOutlineBig(27, 20, 8, 8);
    }
    canvasRenderer.setDrawColor(127, 127, 127, 255);
    rrFillItem(32, 34);
}
function baDrawEntities() {
    canvasRenderer.setDrawColor(10, 10, 240, 127);
    for (let i = 0; i < baRunners.length; ++i) {
        rrFill(baRunners[i].x, baRunners[i].y);
    }
    if (baCollectorX !== -1) {
        canvasRenderer.setDrawColor(240, 240, 10, 200);
        rrFill(baCollectorX, baCollectorY);
    }
}

var baRunners;
var baTickCounter;
var baRunnersAlive;
var baRunnersKilled;
var baTotalRunners;
var baMaxRunnersAlive;
var baCollectorX;
var baCollectorY;
var baRunnerMovements;
var baRunnerMovementsIndex;
var baCurrentRunnerId;
const mLOS_FULL_MASK = 0x20000;
const mLOS_EAST_MASK = 0x1000;
const mLOS_WEST_MASK = 0x10000;
const mLOS_NORTH_MASK = 0x400;
const mLOS_SOUTH_MASK = 0x4000;
const mMOVE_FULL_MASK = 0x100 | 0x200000 | 0x40000 | 0x1000000; // 0x100 for objects, 0x200000 for unwalkable tiles such as water etc, 0x40000 is very rare but BA cannon has it. 0x1000000 is not confirmed to block move but outside ba arena 1-9.
const mMOVE_EAST_MASK = 0x8;
const mMOVE_WEST_MASK = 0x80;
const mMOVE_NORTH_MASK = 0x2;
const mMOVE_SOUTH_MASK = 0x20;
function mInit(map, widthTiles, heightTiles) {
    mCurrentMap = map;
    mWidthTiles = widthTiles;
    mHeightTiles = heightTiles;
    mResetMap();
}
function mResetMap() {
    resetMap();
    mItemZones = [];
    mItemZonesWidth = 1 + ((mWidthTiles - 1) >> 3);
    mItemZonesHeight = 1 + ((mHeightTiles - 1) >> 3);
    for (let xZone = 0; xZone < mItemZonesWidth; ++xZone) {
        for (let yZone = 0; yZone < mItemZonesHeight; ++yZone) {
            mItemZones[xZone + mItemZonesWidth * yZone] = [];
        }
    }
}
function mAddItem(item) {
    addItem(item);
    mGetItemZone(item.x >>> 3, item.y >>> 3).push(item);
}
function mGetItemZone(xZone, yZone) {
    return mItemZones[xZone + mItemZonesWidth * yZone];
}
function mGetTileFlag(x, y) {
    return mCurrentMap[x + y * mWidthTiles];
}
function mDrawGrid() {
    for (var xTile = 0; xTile < mWidthTiles; ++xTile) {
        if (xTile % 8 == 7) {
            canvasRenderer.setDrawColor(0, 0, 0, 72);
        } else {
            canvasRenderer.setDrawColor(0, 0, 0, 48);
        }
        rrEastLineBig(xTile, 0, mHeightTiles);
    }
    for (var yTile = 0; yTile < mHeightTiles; ++yTile) {
        if (yTile % 8 == 7) {
            canvasRenderer.setDrawColor(0, 0, 0, 72);
        } else {
            canvasRenderer.setDrawColor(0, 0, 0, 48);
        }
        rrNorthLineBig(0, yTile, mWidthTiles);
    }
}
function mDrawItems() {
    let endI = mItemZones.length;
    for (let i = 0; i < endI; ++i) {
        let itemZone = mItemZones[i];
        let endJ = itemZone.length;
        for (let j = 0; j < endJ; ++j) {
            let item = itemZone[j];
            canvasRenderer.setDrawColor(
                item.colorRed,
                item.colorGreen,
                item.colorBlue,
                127
            );
            rrFillItem(item.x, item.y);
        }
    }
}
function mDrawMap() {
    canvasRenderer.setDrawColor(206, 183, 117, 255);
    canvasRenderer.clear();
    for (let y = 0; y < mHeightTiles; ++y) {
        for (let x = 0; x < mWidthTiles; ++x) {
            let tileFlag = mGetTileFlag(x, y);
            if ((tileFlag & mLOS_FULL_MASK) !== 0) {
                canvasRenderer.setDrawColor(0, 0, 0, 255);
                rrFillOpaque(x, y);
            } else {
                if ((tileFlag & mMOVE_FULL_MASK) !== 0) {
                    canvasRenderer.setDrawColor(127, 127, 127, 255);
                    rrFillOpaque(x, y);
                }
                if ((tileFlag & mLOS_EAST_MASK) !== 0) {
                    canvasRenderer.setDrawColor(0, 0, 0, 255);
                    rrEastLine(x, y);
                } else if ((tileFlag & mMOVE_EAST_MASK) !== 0) {
                    canvasRenderer.setDrawColor(127, 127, 127, 255);
                    rrEastLine(x, y);
                }
                if ((tileFlag & mLOS_WEST_MASK) !== 0) {
                    canvasRenderer.setDrawColor(0, 0, 0, 255);
                    rrWestLine(x, y);
                } else if ((tileFlag & mMOVE_WEST_MASK) !== 0) {
                    canvasRenderer.setDrawColor(127, 127, 127, 255);
                    rrWestLine(x, y);
                }
                if ((tileFlag & mLOS_NORTH_MASK) !== 0) {
                    canvasRenderer.setDrawColor(0, 0, 0, 255);
                    rrNorthLine(x, y);
                } else if ((tileFlag & mMOVE_NORTH_MASK) !== 0) {
                    canvasRenderer.setDrawColor(127, 127, 127, 255);
                    rrNorthLine(x, y);
                }
                if ((tileFlag & mLOS_SOUTH_MASK) !== 0) {
                    canvasRenderer.setDrawColor(0, 0, 0, 255);
                    rrSouthLine(x, y);
                } else if ((tileFlag & mMOVE_SOUTH_MASK) !== 0) {
                    canvasRenderer.setDrawColor(127, 127, 127, 255);
                    rrSouthLine(x, y);
                }
            }
        }
    }
}
var mCurrentMap;
var mWidthTiles;
var mHeightTiles;
var mItemZones;
var mItemZonesWidth;
var mItemZonesHeight;

function rrFillOpaque(x, y) {
    canvasRenderer.setFilledRect(
        x * Constants.TILE_SIZE,
        y * Constants.TILE_SIZE,
        Constants.TILE_SIZE,
        Constants.TILE_SIZE
    );
}
function rrFill(x, y) {
    canvasRenderer.drawFilledRect(
        x * Constants.TILE_SIZE,
        y * Constants.TILE_SIZE,
        Constants.TILE_SIZE,
        Constants.TILE_SIZE
    );
}
function rrOutline(x, y) {
    canvasRenderer.drawOutlinedRect(
        x * Constants.TILE_SIZE,
        y * Constants.TILE_SIZE,
        Constants.TILE_SIZE,
        Constants.TILE_SIZE
    );
}
function rrOutlineBig(x, y, width, height) {
    canvasRenderer.drawOutlinedRect(
        x * Constants.TILE_SIZE,
        y * Constants.TILE_SIZE,
        Constants.TILE_SIZE * width,
        Constants.TILE_SIZE * height
    );
}
function rrWestLine(x, y) {
    canvasRenderer.drawVerticalLine(
        x * Constants.TILE_SIZE,
        y * Constants.TILE_SIZE,
        Constants.TILE_SIZE
    );
}
function rrEastLine(x, y) {
    canvasRenderer.drawVerticalLine(
        (x + 1) * Constants.TILE_SIZE - 1,
        y * Constants.TILE_SIZE,
        Constants.TILE_SIZE
    );
}
function rrEastLineBig(x, y, length) {
    canvasRenderer.drawVerticalLine(
        (x + 1) * Constants.TILE_SIZE - 1,
        y * Constants.TILE_SIZE,
        Constants.TILE_SIZE * length
    );
}
function rrSouthLine(x, y) {
    canvasRenderer.drawHorizontalLine(
        x * Constants.TILE_SIZE,
        y * Constants.TILE_SIZE,
        Constants.TILE_SIZE
    );
}
function rrNorthLine(x, y) {
    canvasRenderer.drawHorizontalLine(
        x * Constants.TILE_SIZE,
        (y + 1) * Constants.TILE_SIZE - 1,
        Constants.TILE_SIZE
    );
}
function rrNorthLineBig(x, y, length) {
    canvasRenderer.drawHorizontalLine(
        x * Constants.TILE_SIZE,
        (y + 1) * Constants.TILE_SIZE - 1,
        Constants.TILE_SIZE * length
    );
}
function rrCone(x, y) {
    canvasRenderer.drawCone(
        x * Constants.TILE_SIZE,
        y * Constants.TILE_SIZE,
        Constants.TILE_SIZE
    );
}
function rrFillItem(x, y) {
    let padding = Constants.TILE_SIZE >>> 2;
    let size = Constants.TILE_SIZE - 2 * padding;
    canvasRenderer.drawFilledRect(
        x * Constants.TILE_SIZE + padding,
        y * Constants.TILE_SIZE + padding,
        size,
        size
    );
}
