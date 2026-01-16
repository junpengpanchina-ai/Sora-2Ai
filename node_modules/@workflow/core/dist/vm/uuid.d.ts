/**
 * Returns a function that generates a random UUID, based on the given RNG.
 *
 * `rng` is expected to be a seeded random number generator (i.e. `seedrandom.PRNG` instance).
 *
 * @param rng - A function that returns a random number between 0 and 1.
 * @returns A `crypto.randomUUID`-like function.
 */
export declare function createRandomUUID(rng: () => number): () => ReturnType<typeof crypto.randomUUID>;
//# sourceMappingURL=uuid.d.ts.map