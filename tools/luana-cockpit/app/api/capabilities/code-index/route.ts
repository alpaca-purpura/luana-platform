/**
 * GET /api/capabilities/code-index?brand=vitalia
 * → { index: CodeIndexReport | null, path: string, brand: string, hint?: string }
 *
 * Lee `{brand}/docs/product/capabilities/_code-index.json`.
 * Producido por `scripts/generate_code_to_cap_index.py` (cement 2026-05-28 · Fase A).
 * Si no existe → null + hint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { errorResponse } from '../../_lib/responses';
import { getBrands, getWorkspaceRoot } from '@/lib/workspace';
import type { CodeIndexReport } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const brand = req.nextUrl.searchParams.get('brand');
  if (!brand) return errorResponse('query param "brand" requerido', 400);
  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  const wsRoot = getWorkspaceRoot();
  const jsonPath = path.join(
    wsRoot,
    brand,
    'docs',
    'product',
    'capabilities',
    '_code-index.json'
  );

  try {
    const raw = await readFile(jsonPath, 'utf-8');
    let data: CodeIndexReport;
    try {
      data = JSON.parse(raw) as CodeIndexReport;
    } catch (parseErr) {
      return errorResponse(
        `_code-index.json mal formado: ${(parseErr as Error).message}`,
        500,
        { path: jsonPath }
      );
    }
    return NextResponse.json({ index: data, path: jsonPath, brand });
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      return NextResponse.json({
        index: null,
        path: jsonPath,
        brand,
        hint: `Ejecuta: python3 scripts/generate_code_to_cap_index.py --brand ${brand}`,
      });
    }
    return errorResponse(
      `error leyendo _code-index.json: ${(err as Error).message}`,
      500,
      { path: jsonPath }
    );
  }
}
