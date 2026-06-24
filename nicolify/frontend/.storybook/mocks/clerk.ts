/**
 * Mock de @clerk/nextjs para Storybook (@storybook/nextjs-vite moduleNameMapper).
 *
 * Provee stubs de los hooks de Clerk que usan los componentes de Nicolify:
 *   - useAuth        → token fijo 'sb-token', isLoaded=true, isSignedIn=true
 *   - useUser        → usuario sintético LatAm B2B
 *   - useTenantId    → UUID sintético de tenant (hook brandlocal que lee publicMetadata)
 *
 * NO vi.mock — este archivo es importado automáticamente por el moduleNameMapper
 * de @storybook/nextjs-vite cuando los componentes importan '@clerk/nextjs'.
 *
 * Ver: .storybook/main.ts moduleNameMapper (configureado via viteFinal alias).
 */

export const useAuth = () => ({
  getToken: async () => "sb-token-storybook",
  isLoaded: true,
  isSignedIn: true,
  userId: "user_sb_nicolify",
  sessionId: "sess_sb_nicolify",
  signOut: async () => undefined,
});

export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: "user_sb_nicolify",
    firstName: "Demo",
    lastName: "Nicolify",
    primaryEmailAddress: { emailAddress: "demo@agencia-ejemplo.com" },
    publicMetadata: {
      tenant_id: "tenant-uuid-storybook-00000001",
    },
  },
});

/** useTenantId — hook brand-local que lee publicMetadata.tenant_id */
export const useTenantId = () => "tenant-uuid-storybook-00000001";

/** ClerkProvider stub — envuelve children sin nada (providers.tsx lo usa) */
export const ClerkProvider = ({ children }: { children: React.ReactNode }) => children;

/** SignIn / SignUp stubs por si se importan */
export const SignIn = () => null;
export const SignUp = () => null;

/** auth() stub para Server Components */
export const auth = () => ({
  userId: "user_sb_nicolify",
  getToken: async () => "sb-token-storybook",
});

export const currentUser = async () => null;
