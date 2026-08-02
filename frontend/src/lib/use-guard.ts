import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useTwin } from "./twin-store";

export function useGuard() {
  const { state, ready } = useTwin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!ready) {
      setOk(false);
      return;
    }

    const isAuthRoute = pathname === "/";
    if (!state.authed && !isAuthRoute) {
      setOk(false);
      return;
    }

    setOk(true);
  }, [pathname, ready, state.authed]);

  return ok;
}
