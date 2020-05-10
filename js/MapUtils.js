import {
    mWAVE_1_TO_9,
    mWAVE10,
    WIDTH_TILES,
    HEIGHT_TILES,
} from './MapConstants.js';

let mItemZones;
let mItemZonesWidth;
let mItemZonesHeight;
let playerPosition = {
    x: -1,
    y: 0,
};
let collPosition = {
    x: -1,
    y: 0,
};

export function setPlayerPosition(x, y) {
    playerPosition = {
        x,
        y,
    };
}

export function getPlayerPosition() {
    return playerPosition;
}

export function getItemZonesWidth() {
    return mItemZonesWidth;
}

export function getItemZonesHeight() {
    return mItemZonesHeight;
}

export function setCollPosition(x, y) {
    collPosition = {
        x,
        y,
    };
}

export function getCollPosition() {
    return collPosition;
}

export function getItemZones() {
    return mItemZones;
}

export function resetMap() {
    mItemZones = [];
    mItemZonesWidth = 1 + ((WIDTH_TILES - 1) >> 3);
    mItemZonesHeight = 1 + ((HEIGHT_TILES - 1) >> 3);
    for (let xZone = 0; xZone < mItemZonesWidth; ++xZone) {
        for (let yZone = 0; yZone < mItemZonesHeight; ++yZone) {
            mItemZones[xZone + mItemZonesWidth * yZone] = [];
        }
    }
}

export function getItemZone(xZone, yZone) {
    return mItemZones[xZone + mItemZonesWidth * yZone];
}

export function addItem(item) {
    getItemZone(item.x >>> 3, item.y >>> 3).push(item);
}

export function getTileFlag(x, y) {
    const map = getCurrentMap();
    return map[x + y * WIDTH_TILES];
}

function getCurrentMap() {
    return window.settings.wave === 10 ? mWAVE10 : mWAVE_1_TO_9;
}
