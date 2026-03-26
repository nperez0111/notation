// Local Bun/fs type overrides to match Bun's runtime behavior.
// Extend Node's fs module so rmdirSync accepts an options object,
// which Bun supports at runtime (e.g. { recursive: true }).

import "fs";

declare module "fs" {
  interface BunRecursiveRmdirOptions {
    recursive?: boolean;
  }

  // Augment Node's declaration with an overload that includes options.
  // The existing `rmdirSync(path: PathLike): void` from @types/node remains,
  // but this makes two-argument calls type-safe in Bun projects.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function rmdirSync(path: import("fs").PathLike, options?: BunRecursiveRmdirOptions): void;
}
