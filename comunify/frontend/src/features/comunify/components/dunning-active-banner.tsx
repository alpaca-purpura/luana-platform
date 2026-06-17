// TODO T-fe-6 polish post-merge: wire real dunning count + resend payment link action

interface DunningActiveBannerProps {
  dunningCount?: number;
  onResendAll?: () => void;
  className?: string;
}

export function DunningActiveBanner({
  dunningCount = 0,
  onResendAll,
  className,
}: DunningActiveBannerProps) {
  if (dunningCount === 0) return null;

  return (
    <div role="alert" className={className} data-testid="dunning-active-banner">
      <div className="flex items-center justify-between rounded-xl border border-comunify-warning bg-comunify-warning/10 p-4">
        <div>
          <p className="font-semibold text-comunify-warning-text">
            {dunningCount === 1
              ? "1 suscripción en cobranza"
              : `${dunningCount} suscripciones en cobranza`}
          </p>
          <p className="text-sm text-comunify-warning-text">
            Hay pagos pendientes que requieren atención.
          </p>
        </div>
        {onResendAll && (
          <button
            type="button"
            onClick={onResendAll}
            className="rounded-lg bg-comunify-warning/10 border border-comunify-warning px-4 py-2 text-sm font-medium text-comunify-warning-text hover:bg-comunify-warning/20 focus:outline-none focus:ring-2 focus:ring-comunify-warning/50"
          >
            Reenviar enlaces
          </button>
        )}
      </div>
    </div>
  );
}
