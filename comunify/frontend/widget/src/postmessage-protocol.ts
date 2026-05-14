/**
 * PostMessage protocol for the Comunify subscription widget.
 * Iframe ↔ host page communication contract.
 * TODO T-widget-1 polish post-merge: full protocol implementation.
 */

export type WidgetInboundMessage =
  | { type: "RESIZE"; height: number }
  | { type: "SUBSCRIBE_SUCCESS"; subscriptionId: string }
  | { type: "SUBSCRIBE_ERROR"; message: string }
  | { type: "CLOSE" };

export type WidgetOutboundMessage =
  | { type: "INIT"; creatorHandle: string; offerId?: string }
  | { type: "THEME"; theme: "light" | "dark" };

export function postToHost(message: WidgetInboundMessage): void {
  window.parent.postMessage(message, "*");
}

export function createWidgetIframe(
  containerId: string,
  creatorHandle: string,
  offerId?: string
): HTMLIFrameElement | null {
  const container = document.getElementById(containerId);
  if (!container) return null;

  const iframe = document.createElement("iframe");
  const baseUrl =
    (document.currentScript as HTMLScriptElement | null)?.dataset?.baseUrl ??
    "https://cdn.comunify.io";
  const src = new URL(`/${creatorHandle}/subscribe`, baseUrl);
  if (offerId) src.searchParams.set("offer_id", offerId);

  iframe.src = src.toString();
  iframe.style.cssText = "width:100%;border:none;min-height:480px;";
  iframe.title = "Suscribirse — Comunify";
  iframe.loading = "lazy";
  container.appendChild(iframe);
  return iframe;
}
