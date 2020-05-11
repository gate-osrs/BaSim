import * as Constants from './Constants.js';

export class Canvas {
    constructor(canvasEl, width, height) {
        this.canvasEl = canvasEl;
        this.context = canvasEl.getContext('2d');
        this.width = width;
        this.height = height;
        this.canvasEl.width = width;
        this.canvasEl.height = height;
        this.canvasYFixOffset = (height - 1) * width;
        this.imageData = this.context.createImageData(width, height);
        this.pixels = new ArrayBuffer(this.imageData.data.length);
        this.pixels8 = new Uint8ClampedArray(this.pixels);
        this.pixels32 = new Uint32Array(this.pixels);
        this.rDrawColorRB = 255;
        this.rDrawColorG = 255;
        this.rDrawColor = 255;
        this.rDrawColorA = 255;
    }

    setDrawColor(r, g, b, a) {
        this.rDrawColorRB = r | (b << 16);
        this.rDrawColorG = Constants.PIXEL_ALPHA | (g << 8);
        this.rDrawColor = this.rDrawColorRB | this.rDrawColorG;
        this.rDrawColorA = a + 1;
    }

    drawPixel(i) {
        let color = this.pixels32[i];
        let oldRB = color & 0xff00ff;
        let oldAG = color & 0xff00ff00;
        let rb =
            (oldRB + ((this.rDrawColorA * (this.rDrawColorRB - oldRB)) >> 8)) &
            0xff00ff;
        let g =
            (oldAG + ((this.rDrawColorA * (this.rDrawColorG - oldAG)) >> 8)) &
            0xff00ff00;
        this.pixels32[i] = rb | g;
    }

    drawHorizontalLine(x, y, length) {
        let i = this.rXYToI(x, y);
        let endI = i + length;
        for (; i < endI; ++i) {
            this.drawPixel(i);
        }
    }

    drawVerticalLine(x, y, length) {
        let i = this.rXYToI(x, y);
        let endI = i - length * this.width;
        for (; i > endI; i -= this.width) {
            this.drawPixel(i);
        }
    }

    setFilledRect(x, y, width, height) {
        let i = this.rXYToI(x, y);
        let rowDelta = width + this.width;
        let endYI = i - height * this.width;
        while (i > endYI) {
            let endXI = i + width;
            for (; i < endXI; ++i) {
                this.pixels32[i] = this.rDrawColor;
            }
            i -= rowDelta;
        }
    }

    drawFilledRect(x, y, width, height) {
        let i = this.rXYToI(x, y);
        let rowDelta = width + this.width;
        let endYI = i - height * this.width;
        while (i > endYI) {
            let endXI = i + width;
            for (; i < endXI; ++i) {
                this.drawPixel(i);
            }
            i -= rowDelta;
        }
    }

    drawOutlinedRect(x, y, width, height) {
        this.drawHorizontalLine(x, y, width);
        this.drawHorizontalLine(x, y + height - 1, width);
        this.drawVerticalLine(x, y + 1, height - 2);
        this.drawVerticalLine(x + width - 1, y + 1, height - 2);
    }

    drawCone(x, y, width) {
        // Not optimised to use i yet
        let lastX = x + width - 1;
        let endI = (width >>> 1) + (width & 1);
        for (let i = 0; i < endI; ++i) {
            this.drawPixel(this.rXYToI(x + i, y));
            this.drawPixel(this.rXYToI(lastX - i, y));
            ++y;
        }
    }

    rXYToI(x, y) {
        return this.canvasYFixOffset + x - y * this.width;
    }

    clear() {
        for (let i = 0; i < this.pixels32.length; i++) {
            this.pixels32[i] = this.rDrawColor;
        }
    }

    present() {
        this.imageData.data.set(this.pixels8);
        this.context.putImageData(this.imageData, 0, 0);
    }
}
