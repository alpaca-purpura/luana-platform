"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type {
  AuthorityVault,
  AuthorityCredential,
  AuthorityCaseStudy,
  AuthorityPressMention,
} from "../types/authority-vault.types";

type VaultTab = "credentials" | "case_studies" | "press_mentions";

interface AuthorityVaultEditorProps {
  vault?: AuthorityVault;
  onAddCredential: (
    data: Omit<AuthorityCredential, "id" | "url_status">,
  ) => void;
  onAddCaseStudy: (data: Omit<AuthorityCaseStudy, "id" | "url_status">) => void;
  onAddPressMention: (
    data: Omit<AuthorityPressMention, "id" | "url_status">,
  ) => void;
  isLoading?: boolean;
  className?: string;
}

const TAB_LABELS: Record<VaultTab, string> = {
  credentials: "Credenciales",
  case_studies: "Casos de éxito",
  press_mentions: "Prensa",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    valid: "bg-comunify-stable/10 text-comunify-stable-text",
    invalid: "bg-comunify-critical/10 text-comunify-critical-text",
    unverified: "bg-comunify-bg text-comunify-text-muted",
  };
  const labels: Record<string, string> = {
    valid: "Verificado",
    invalid: "No válido",
    unverified: "Sin verificar",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs",
        map[status] ?? map.unverified,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function AuthorityVaultEditor({
  vault,
  onAddCredential: _onAddCredential,
  onAddCaseStudy: _onAddCaseStudy,
  onAddPressMention: _onAddPressMention,
  isLoading,
  className,
}: AuthorityVaultEditorProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>("credentials");

  if (isLoading) {
    return (
      <div
        className={cn("flex flex-col gap-4", className)}
        aria-busy="true"
        aria-label="Cargando bóveda de autoridad"
      >
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Score header */}
      {vault && (
        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Puntuación de autoridad
            </p>
            <p className="text-3xl font-bold">{vault.total_score}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{vault.credentials.length} credenciales</p>
            <p>{vault.case_studies.length} casos</p>
            <p>{vault.press_mentions.length} menciones</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1" role="tablist">
        {(Object.keys(TAB_LABELS) as VaultTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`vault-panel-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === tab
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div id={`vault-panel-${activeTab}`} role="tabpanel">
        {activeTab === "credentials" && (
          <VaultItemList<AuthorityCredential>
            items={vault?.credentials ?? []}
            renderItem={(c) => (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.issuer}
                    {c.issued_year ? ` · ${c.issued_year}` : ""}
                  </p>
                </div>
                <StatusBadge status={c.url_status} />
              </div>
            )}
            emptyLabel="No hay credenciales aún"
          />
        )}
        {activeTab === "case_studies" && (
          <VaultItemList<AuthorityCaseStudy>
            items={vault?.case_studies ?? []}
            renderItem={(c) => (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.client_name}
                  </p>
                  <p className="mt-1 text-xs">{c.result_summary}</p>
                </div>
                <StatusBadge status={c.url_status} />
              </div>
            )}
            emptyLabel="No hay casos de éxito aún"
          />
        )}
        {activeTab === "press_mentions" && (
          <VaultItemList<AuthorityPressMention>
            items={vault?.press_mentions ?? []}
            renderItem={(m) => (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{m.headline}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.publication}
                    {m.published_at ? ` · ${m.published_at.slice(0, 10)}` : ""}
                  </p>
                </div>
                <StatusBadge status={m.url_status} />
              </div>
            )}
            emptyLabel="No hay menciones en prensa aún"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Page-level client wrapper for the authority vault route.
 * TODO T-fe-3 polish post-merge: wire useAuthorityVault hook.
 */
export function AuthorityVaultClient() {
  return (
    <div
      className="flex flex-col gap-6 p-6"
      data-testid="authority-vault-client"
    >
      <h1 className="text-2xl font-bold">Bóveda de autoridad</h1>
      <AuthorityVaultEditor
        onAddCredential={() => undefined}
        onAddCaseStudy={() => undefined}
        onAddPressMention={() => undefined}
      />
    </div>
  );
}

function VaultItemList<T extends { id: string }>({
  items,
  renderItem,
  emptyLabel,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border bg-card py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border bg-card p-3 text-sm">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}
