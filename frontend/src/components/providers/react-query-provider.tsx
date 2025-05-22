"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode} from "react";

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  const queryclient = new QueryClient()
  return (
    <QueryClientProvider client={queryclient}>
      {children}
    </QueryClientProvider>
  );
}