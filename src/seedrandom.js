import seedrandom from 'seedrandom';

export class SeededRandom {
    constructor(seed = 1234) {
        this.rng = seedrandom(seed);
    }

    // Generate a random number between 0 and 1
    random() {
        return this.rng();
    }

    // Generate a random number between min and max
    randomRange(min, max) {
        return min + (max - min) * this.random();
    }
}

// Create and export a default instance
export const seededRandom = new SeededRandom();
