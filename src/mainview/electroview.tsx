import { createContext, useContext } from "react";
import { Electroview } from "electrobun/view";
import type { DocumentRPC } from "../shared/types";

const rpc = Electroview.defineRPC<DocumentRPC>({
  maxRequestTime: 5000,
  handlers: {
    requests: {
      openSettings: () => {
        window.dispatchEvent(new CustomEvent("open-settings"));
      },
    },
    messages: {},
  },
});

const electroview = new Electroview({ rpc });

export type DocumentRpcRequest = NonNullable<typeof electroview.rpc>["request"];

const RpcContext = createContext<NonNullable<typeof electroview.rpc>["request"] | null>(null);

export function useRpc(): DocumentRpcRequest {
  const r = useContext(RpcContext);
  if (!r) throw new Error("useRpc must be used within RpcProvider");
  return r;
}

export function RpcProvider({ children }: { children: React.ReactNode }) {
  return <RpcContext.Provider value={electroview.rpc!.request}>{children}</RpcContext.Provider>;
}
