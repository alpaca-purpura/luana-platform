/**
 * GET /api/system-map?brand=vitalia  → { system_map: SystemMap, path: string }
 *
 * Lee {brand}/docs/architecture/SYSTEM-MAP.yaml (schema v1.0).
 * SSoT estructural del producto · ADR-vitalia-005.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { errorResponse } from '../_lib/responses';
import { getBrands, getWorkspaceRoot } from '@/lib/workspace';
import type { SystemMap } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const brand = req.nextUrl.searchParams.get('brand');
  if (!brand) return errorResponse('query param "brand" requerido', 400);
  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  const wsRoot = getWorkspaceRoot();
  const yamlPath = path.join(wsRoot, brand, 'docs', 'architecture', 'SYSTEM-MAP.yaml');

  try {
    const raw = await readFile(yamlPath, 'utf-8');
    const data = YAML.parse(raw) as SystemMap;
    return NextResponse.json({ system_map: data, path: yamlPath });
  } catch (err) {
    return errorResponse(`error leyendo SYSTEM-MAP.yaml: ${(err as Error).message}`, 500);
  }
}
