export class Food {
    constructor(x, y, good) {
        this.x = x;
        this.y = y;
        this.colorRed = good ? 0 : 255;
        this.colorGreen = good ? 255 : 0;
        this.colorBlue = 0;
    }
}
