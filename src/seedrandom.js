// A simple seeded random number generator
export class SeededRandom {
    constructor(seed = 1234) {
        this.seed = seed;
    }

    // Generate a random number between 0 and 1
    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    // Generate a random number between min and max
    randomRange(min, max) {
        return min + (max - min) * this.random();
    }
}

// Create and export a default instance
export const seededRandom = new SeededRandom();
