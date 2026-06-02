/**
 * Cliente fetch tipado para la API interna del cockpit.
 *
 * Convenciones:
 *   - Todos los endpoints son same-origin (Next.js API routes).
 *   - Errores HTTP ≥400 lanzan `ApiClientError` con el body parseado.
 *   - Helpers GET/POST/PATCH/PUT/DELETE encapsulan JSON.
 */

import type {
  Story,
  Release,
  Capability,
  ChrisInput,
  SystemMap,
  StoryState,
  CapChangeType,
  RefType,
  ComputedStatusReport,
  CodeIndexReport,
  BidirectionalValidationReport,
  ActiveSession,
} from '@/lib/types';
import type { HarnessItem } from '@/lib/harness-backlog';

export class ApiClientError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // body vacío · OK
  }
  if (!res.ok) {
    const msg =
      (body as { error?: string } | null)?.error ?? `HTTP ${res.status}`;
    throw new ApiClientError(msg, res.status, body);
  }
  return body as T;
}

// ────────────────────────────────────────────────────────────────────────────
// Stories
// ────────────────────────────────────────────────────────────────────────────

export interface StoryWithArchive extends Story {
  is_archived: boolean;
}

export async function listStories(brand: string): Promise<StoryWithArchive[]> {
  const data = await request<{ stories: StoryWithArchive[] }>(
    `/api/stories?brand=${encodeURIComponent(brand)}`
  );
  return data.stories;
}

export async function getStory(id: string, brand: string): Promise<Story> {
  const data = await request<{ story: Story }>(
    `/api/stories/${encodeURIComponent(id)}?brand=${encodeURIComponent(brand)}`
  );
  return data.story;
}

export async function updateStory(
  id: string,
  brand: string,
  patch: Partial<Story>
): Promise<Story> {
  const data = await request<{ story: Story }>(
    `/api/stories/${encodeURIComponent(id)}?brand=${encodeURIComponent(brand)}`,
    { method: 'PATCH', body: JSON.stringify({ fields: patch }) }
  );
  return data.story;
}

// ────────────────────────────────────────────────────────────────────────────
// Active sessions (build-claims · ADR-009 single-hub worktree)
// ────────────────────────────────────────────────────────────────────────────

export interface SessionsResponse {
  sessions: ActiveSession[];
  by_story: Record<string, ActiveSession>;
}

/** Sesiones Claude/opencode vivas trabajando sobre el hub (lee `.session-locks/`). */
export async function listSessions(): Promise<SessionsResponse> {
  return request<SessionsResponse>('/api/sessions');
}

// ────────────────────────────────────────────────────────────────────────────
// Releases
// ────────────────────────────────────────────────────────────────────────────

export async function listReleases(brand: string): Promise<Release[]> {
  const data = await request<{ releases: Release[] }>(
    `/api/releases?brand=${encodeURIComponent(brand)}`
  );
  return data.releases;
}

export interface CreateReleaseInput {
  release_id: string;
  brand: string;
  name: string;
  description: string;
  target_date?: string | null;
  order?: number;
}

export async function createRelease(input: CreateReleaseInput): Promise<Release> {
  const data = await request<{ release: Release }>('/api/releases', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.release;
}

export interface UpdateReleaseInput {
  name?: string;
  description?: string;
  target_date?: string | null;
  order?: number;
  stories?: string[];
}

/** Edita campos editables de un release (bloqueado server-side si está shipped). */
export async function updateRelease(
  releaseId: string,
  brand: string,
  patch: UpdateReleaseInput
): Promise<Release> {
  const data = await request<{ release: Release }>(
    `/api/releases?id=${encodeURIComponent(releaseId)}&brand=${encodeURIComponent(brand)}`,
    { method: 'PUT', body: JSON.stringify(patch) }
  );
  return data.release;
}

// ────────────────────────────────────────────────────────────────────────────
// Capabilities
// ────────────────────────────────────────────────────────────────────────────

export async function listCapabilities(brand: string): Promise<Capability[]> {
  const data = await request<{ capabilities: Capability[] }>(
    `/api/capabilities?brand=${encodeURIComponent(brand)}`
  );
  return data.capabilities;
}

export async function getCapability(
  module: string,
  cap: string,
  brand: string
): Promise<Capability> {
  const data = await request<{ capability: Capability }>(
    `/api/capabilities/${encodeURIComponent(module)}/${encodeURIComponent(cap)}?brand=${encodeURIComponent(brand)}`
  );
  return data.capability;
}

// ────────────────────────────────────────────────────────────────────────────
// chris-input
// ────────────────────────────────────────────────────────────────────────────

export async function getChrisInput(
  storyId: string,
  brand: string
): Promise<ChrisInput> {
  const data = await request<{ chrisInput: ChrisInput }>(
    `/api/chris-input/${encodeURIComponent(storyId)}?brand=${encodeURIComponent(brand)}`
  );
  return data.chrisInput;
}

export async function appendChrisInputNote(
  storyId: string,
  brand: string,
  text: string
): Promise<ChrisInput> {
  const data = await request<{ chrisInput: ChrisInput }>(
    `/api/chris-input/${encodeURIComponent(storyId)}?brand=${encodeURIComponent(brand)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ section: 'notes', entry: { text } }),
    }
  );
  return data.chrisInput;
}

export async function appendChrisInputRef(
  storyId: string,
  brand: string,
  ref: { type: RefType; value: string; comment?: string }
): Promise<ChrisInput> {
  const data = await request<{ chrisInput: ChrisInput }>(
    `/api/chris-input/${encodeURIComponent(storyId)}?brand=${encodeURIComponent(brand)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ section: 'refs', entry: ref }),
    }
  );
  return data.chrisInput;
}

export async function appendChrisInputConversation(
  storyId: string,
  brand: string,
  text: string
): Promise<ChrisInput> {
  const data = await request<{ chrisInput: ChrisInput }>(
    `/api/chris-input/${encodeURIComponent(storyId)}?brand=${encodeURIComponent(brand)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ section: 'conversation', entry: { author: 'chris', text } }),
    }
  );
  return data.chrisInput;
}

// ────────────────────────────────────────────────────────────────────────────
// File contents
// ────────────────────────────────────────────────────────────────────────────

export async function getFile(relPath: string): Promise<string> {
  const data = await request<{ path: string; content: string }>(
    `/api/file?path=${encodeURIComponent(relPath)}`
  );
  return data.content;
}

export async function putFile(relPath: string, content: string): Promise<void> {
  await request('/api/file', {
    method: 'PUT',
    body: JSON.stringify({ path: relPath, content }),
  });
}

export async function openInEditor(
  absOrRelPath: string
): Promise<{ ok: true; editor?: string }> {
  return await request<{ ok: true; editor?: string }>('/api/open', {
    method: 'POST',
    body: JSON.stringify({ path: absOrRelPath }),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Harness backlog (read-only · transversal, no brand-scoped)
// ────────────────────────────────────────────────────────────────────────────

export async function listHarnessItems(): Promise<{
  items: HarnessItem[];
  counts: Record<string, number>;
  source: string;
}> {
  return await request<{
    items: HarnessItem[];
    counts: Record<string, number>;
    source: string;
  }>('/api/harness');
}

// ────────────────────────────────────────────────────────────────────────────
// Transition
// ────────────────────────────────────────────────────────────────────────────

export async function postTransition(
  brand: string,
  storyId: string,
  targetState: StoryState,
  reason?: string
): Promise<{ ok: true; newState: StoryState }> {
  return await request<{ ok: true; newState: StoryState }>('/api/transition', {
    method: 'POST',
    body: JSON.stringify({ brand, storyId, targetState, reason }),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Story creation
// ────────────────────────────────────────────────────────────────────────────

export interface FromDoneInput {
  brand: string;
  parentStoryId: string;
  newStorySlug: string;
  goal: string;
  release: string;
}

export async function postFromDone(input: FromDoneInput): Promise<{
  storyId: string;
  checkpointPath: string;
  chrisInputPath: string;
}> {
  return await request('/api/from-done', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface ExtendCapInput {
  brand: string;
  parentCap: { module: string; slug: string };
  capChangeType: 'fix' | 'extend' | 'derive';
  newStorySlug: string;
  goal: string;
  release: string;
  derivedName?: string;
}

export async function postExtendCap(input: ExtendCapInput): Promise<{
  storyId: string;
  slug: string;
  checkpointPath: string;
  chrisInputPath: string;
}> {
  return await request('/api/extend-cap', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Merge release
// ────────────────────────────────────────────────────────────────────────────

export interface MergeReleasePlan {
  plan: Array<{
    op: 'archive_story' | 'update_release' | 'generate_release_notes';
    description: string;
    source?: string;
    target?: string;
  }>;
  executed: boolean;
  preview?: boolean;
  note?: string;
  release?: Release;
}

export async function postMergeRelease(
  brand: string,
  releaseId: string,
  confirmFinal: boolean,
  opts?: { verified?: boolean; verificationNote?: string }
): Promise<MergeReleasePlan> {
  return await request('/api/merge-release', {
    method: 'POST',
    body: JSON.stringify({
      brand,
      releaseId,
      confirmFinal,
      verified: opts?.verified ?? false,
      verificationNote: opts?.verificationNote,
    }),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Learnings
// ────────────────────────────────────────────────────────────────────────────

export interface LearningEntry {
  slug: string;
  path: string;
  title?: string;
  date?: string;
  type?: string;
  brand?: string;
  brands_affected?: string[];
  tags?: string[];
  preview?: string;
}

export async function listLearnings(brand: string): Promise<LearningEntry[]> {
  const data = await request<{ learnings: LearningEntry[] }>(
    `/api/learnings?brand=${encodeURIComponent(brand)}`
  );
  return data.learnings;
}

// ────────────────────────────────────────────────────────────────────────────
// System Map
// ────────────────────────────────────────────────────────────────────────────

export async function getSystemMap(brand: string): Promise<SystemMap> {
  const data = await request<{ system_map: SystemMap; path: string }>(
    `/api/system-map?brand=${encodeURIComponent(brand)}`
  );
  return { ...data.system_map, _path: data.path };
}

// ────────────────────────────────────────────────────────────────────────────
// Capability computed status
// ────────────────────────────────────────────────────────────────────────────

export interface CapabilityStatusResponse {
  status: ComputedStatusReport | null;
  path: string;
  brand: string;
  hint?: string;
}

export async function getCapabilityStatus(
  brand: string
): Promise<CapabilityStatusResponse> {
  return await request<CapabilityStatusResponse>(
    `/api/capabilities/status?brand=${encodeURIComponent(brand)}`
  );
}

export interface CodeIndexResponse {
  index: CodeIndexReport | null;
  path: string;
  brand: string;
  hint?: string;
}

export async function getCodeIndex(brand: string): Promise<CodeIndexResponse> {
  return await request<CodeIndexResponse>(
    `/api/capabilities/code-index?brand=${encodeURIComponent(brand)}`
  );
}

export interface BidirectionalValidationResponse {
  validation: BidirectionalValidationReport | null;
  path: string;
  brand: string;
  hint?: string;
}

export async function getBidirectionalValidation(
  brand: string
): Promise<BidirectionalValidationResponse> {
  return await request<BidirectionalValidationResponse>(
    `/api/capabilities/bidirectional?brand=${encodeURIComponent(brand)}`
  );
}

// Re-export type for convenience
export type { CapChangeType };
