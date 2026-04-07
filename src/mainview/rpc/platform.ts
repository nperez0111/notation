/**
 * Platform detection for selecting the correct RPC implementation.
 */

export const isElectrobun = typeof window !== "undefined" && "electrobun" in window;
