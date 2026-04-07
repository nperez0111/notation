/**
 * Platform-agnostic RPC context for the frontend.
 * Both Electrobun and web implementations provide an RpcMethods object to this context.
 */

import { createContext, useContext } from "react";
import type { RpcMethods } from "../../shared/rpc-types";

const RpcContext = createContext<RpcMethods | null>(null);

export function useRpc(): RpcMethods {
  const r = useContext(RpcContext);
  if (!r) throw new Error("useRpc must be used within RpcProvider");
  return r;
}

export function RpcProvider({
  client,
  children,
}: {
  client: RpcMethods;
  children: React.ReactNode;
}) {
  return <RpcContext.Provider value={client}>{children}</RpcContext.Provider>;
}
