/**
 * SuccessStep — final step of subscription widget.
 * Shown after successful subscription.
 * TODO T-widget-1 polish post-merge: wire creator name + onboarding link
 */

import { postToHost } from "../postmessage-protocol";

interface SuccessStepProps {
  creatorName?: string;
  subscriptionId?: string;
  onClose?: () => void;
}

export function SuccessStep({ creatorName, subscriptionId: _subscriptionId, onClose }: SuccessStepProps) {
  const handleClose = () => {
    postToHost({ type: "CLOSE" });
    onClose?.();
  };

  return (
    <div className="widget-step" data-testid="success-step" style={{ textAlign: "center" }}>
      <p className="widget-success-icon" aria-hidden="true">
        🎉
      </p>
      <h2 className="widget-title">¡Bienvenido!</h2>
      <p className="widget-subtitle">
        Tu suscripción{creatorName ? ` a ${creatorName}` : ""} está activa.
        Revisa tu correo para continuar.
      </p>
      <button
        type="button"
        className="widget-btn widget-btn-primary"
        onClick={handleClose}
        style={{ margin: "0 auto" }}
      >
        Cerrar
      </button>
    </div>
  );
}
