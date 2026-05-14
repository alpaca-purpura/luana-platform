// TODO T-fe-6 polish post-merge: wire real dunning count + resend payment link action

interface DunningActiveBannerProps {
  dunningCount?: number;
  onResendAll?: () => void;
  className?: string;
}

export function DunningActiveBanner({ dunningCount = 0, onResendAll, className }: DunningActiveBannerProps) {
  if (dunningCount === 0) return null;

  return (
    <div
      role="alert"
      className={className}
      data-testid="dunning-active-banner"
    >
      <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 p-4">
        <div>
          <p className="font-semibold text-orange-900">
            {dunningCount === 1 ? "1 suscripción en cobranza" : `${dunningCount} suscripciones en cobranza`}
          </p>
          <p className="text-sm text-orange-700">
            Hay pagos pendientes que requieren atención.
          </p>
        </div>
        {onResendAll && (
          <button
            type="button"
            onClick={onResendAll}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Reenviar enlaces
          </button>
        )}
      </div>
    </div>
  );
}
