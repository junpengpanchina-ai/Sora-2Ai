export interface CreateContextOptions {
    seed: string;
    fixedTimestamp: number;
}
/**
 * Creates a Node.js `vm.Context` configured to be usable for
 * executing workflow logic in a deterministic environment.
 *
 * @param options - The options for the context.
 * @returns The context.
 */
export declare function createContext(options: CreateContextOptions): {
    context: import("vm").Context;
    globalThis: typeof globalThis;
    updateTimestamp: (timestamp: number) => void;
};
//# sourceMappingURL=index.d.ts.map