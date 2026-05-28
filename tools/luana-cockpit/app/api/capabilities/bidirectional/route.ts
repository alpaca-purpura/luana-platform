/**
 * GET /api/capabilities/bidirectional?brand=vitalia
 * → { validation: BidirectionalValidationReport | null, path: string, brand: string, hint?: string }
 *
 * Lee `{brand}/docs/product/capabilities/_bidirectional-validation.json`.
 * Producido por `scripts/validate_code_cap_bidirectional.py` (cement 2026-05-28 · Fase B).
 * Si no existe → null + hint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { errorResponse } from '../../_lib/responses';
import { getBrands, getWorkspaceRoot } from '@/lib/workspace';
import type { BidirectionalValidationReport } from '@/lib/types';

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
    '_bidirectional-validation.json'
  );

  try {
    const raw = await readFile(jsonPath, 'utf-8');
    let data: BidirectionalValidationReport;
    try {
      data = JSON.parse(raw) as BidirectionalValidationReport;
    } catch (parseErr) {
      return errorResponse(
        `_bidirectional-validation.json mal formado: ${(parseErr as Error).message}`,
        500,
        { path: jsonPath }
      );
    }
    return NextResponse.json({ validation: data, path: jsonPath, brand });
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      return NextResponse.json({
        validation: null,
        path: jsonPath,
        brand,
        hint: `Ejecuta: python3 scripts/validate_code_cap_bidirectional.py --brand ${brand}`,
      });
    }
    return errorResponse(
      `error leyendo _bidirectional-validation.json: ${(err as Error).message}`,
      500,
      { path: jsonPath }
    );
  }
}
