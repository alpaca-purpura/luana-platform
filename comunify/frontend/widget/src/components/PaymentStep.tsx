/**
 * PaymentStep — step 2 of subscription widget.
 * Collects subscriber email + redirects to payment processor.
 * TODO T-widget-1 polish post-merge: full Stripe/payment wiring
 */

interface PaymentStepProps {
  planName: string;
  planPrice: string;
  onSubscribe: (email: string) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function PaymentStep({
  planName,
  planPrice,
  onSubscribe,
  onBack,
  isSubmitting,
  error,
}: PaymentStepProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = (data.get("email") as string | null) ?? "";
    if (email) {
      void onSubscribe(email);
    }
  };

  return (
    <div className="widget-step" data-testid="payment-step">
      <h2 className="widget-title">Completa tu suscripción</h2>
      <p className="widget-subtitle">
        {planName} — {planPrice}
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label
            htmlFor="widget-email"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
          >
            Correo electrónico
          </label>
          <input
            id="widget-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>

        {error && (
          <p className="widget-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="widget-btn widget-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Procesando..." : "Suscribirme"}
        </button>
      </form>

      <button
        type="button"
        className="widget-btn widget-btn-secondary"
        onClick={onBack}
        disabled={isSubmitting}
        style={{ marginTop: "-0.25rem" }}
      >
        Volver
      </button>
    </div>
  );
}
