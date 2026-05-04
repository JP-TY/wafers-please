"use client";

import { createPortal } from "react-dom";
import { useLayoutEffect, useEffect, useState } from "react";

const PORTAL_HOST_ID = "vr-dom-ui-root";

/**
 * Renders children into the global `#vr-dom-ui-root` mount (see `app/layout.tsx`).
 * WebXR DOM Overlay must target a stable element on `document.body`, not inside a
 * nested transformed subtree, or browsers often never composite the UI in-headset.
 */
export function VrDomUiPortal({
  children,
  enabled,
  isVrUi
}: {
  children: React.ReactNode;
  enabled: boolean;
  isVrUi: boolean;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = document.getElementById(PORTAL_HOST_ID);
    setHost(el instanceof HTMLElement ? el : null);
  }, []);

  useEffect(() => {
    if (!host) return;
    host.classList.toggle("vr-dom-ui-root--xr", isVrUi);
    host.toggleAttribute("aria-hidden", !enabled);
    return () => {
      host.classList.remove("vr-dom-ui-root--xr");
      host.setAttribute("aria-hidden", "true");
    };
  }, [host, isVrUi, enabled]);

  if (!enabled || !host) return null;
  return createPortal(children, host);
}
