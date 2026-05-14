/**
 * widget-entry.tsx — UMD bundle entry point for Comunify subscription widget.
 * Auto-initializes from data-* attributes on target container.
 *
 * Usage (host page):
 *   <div id="comunify-widget"
 *        data-creator="@handle"
 *        data-offer-id="optional-offer-id">
 *   </div>
 *   <script src="https://cdn.comunify.io/widget/v1/comunify.umd.js"
 *           data-base-url="https://cdn.comunify.io"></script>
 *
 * TODO T-widget-1 polish post-merge: full React render + ResizeObserver postMessage
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SubscribeWidgetRoot } from "./components/SubscribeWidgetRoot";
import { createWidgetIframe } from "./postmessage-protocol";
import "./styles.css";

interface WidgetInitOptions {
  containerId: string;
  creatorHandle: string;
  offerId?: string;
  /** If true, renders directly in container without iframe (e.g., inside the iframe itself) */
  inlineMode?: boolean;
}

function initWidget({ containerId, creatorHandle, offerId, inlineMode }: WidgetInitOptions): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[Comunify] Container #${containerId} not found`);
    return;
  }

  if (inlineMode) {
    // Render React directly (used inside iframe page)
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <SubscribeWidgetRoot creatorHandle={creatorHandle} offerId={offerId} />
      </StrictMode>
    );
  } else {
    // Inject iframe pointing to hosted subscribe page
    createWidgetIframe(containerId, creatorHandle, offerId);
  }
}

// Auto-initialize from data attributes
function autoInit(): void {
  const widgetEls = document.querySelectorAll<HTMLElement>("[data-comunify-widget]");
  widgetEls.forEach((el) => {
    const creatorHandle = el.dataset.creator;
    const offerId = el.dataset.offerId;
    const containerId = el.id || `comunify-widget-${Math.random().toString(36).slice(2, 7)}`;
    if (!el.id) el.id = containerId;

    if (!creatorHandle) {
      console.warn("[Comunify] Missing data-creator attribute on widget container");
      return;
    }

    initWidget({ containerId, creatorHandle, offerId });
  });
}

// Expose global API
declare global {
  interface Window {
    ComunifyWidget: {
      init: typeof initWidget;
    };
  }
}

window.ComunifyWidget = { init: initWidget };

// Auto-init on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}

export { initWidget };
export type { WidgetInitOptions };
