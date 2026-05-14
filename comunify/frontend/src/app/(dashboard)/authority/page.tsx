import type { Metadata } from "next";
import { AuthorityVaultClient } from "@/features/comunify/components/authority-vault-editor";

export const metadata: Metadata = {
  title: "Bóveda de autoridad — Comunify",
};

export default function AuthorityPage() {
  return <AuthorityVaultClient />;
}
