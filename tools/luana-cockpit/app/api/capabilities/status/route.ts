/**
 * GET /api/capabilities/status?brand=vitalia
 * → { status: ComputedStatusReport | null, path: string, brand: string, hint?: string }
 *
 * Lee `{brand}/docs/product/capabilities/_status-computed.json`.
 * Ese archivo lo produce `scripts/compute_capability_status.py`.
 * Si el archivo no existe (script no corrido aún) → devuelve status: null + hint, no error.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { errorResponse } from '../../_lib/responses';
import { getBrands, getWorkspaceRoot } from '@/lib/workspace';
import type { ComputedStatusReport } from '@/lib/types';

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
    '_status-computed.json'
  );

  try {
    const raw = await readFile(jsonPath, 'utf-8');
    let data: ComputedStatusReport;
    try {
      data = JSON.parse(raw) as ComputedStatusReport;
    } catch (parseErr) {
      return errorResponse(
        `_status-computed.json mal formado: ${(parseErr as Error).message}`,
        500,
        { path: jsonPath }
      );
    }
    return NextResponse.json({ status: data, path: jsonPath, brand });
  } catch (err) {
    // ENOENT: archivo no existe (script aún no corrido) → respuesta 200 con null
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      return NextResponse.json({
        status: null,
        path: jsonPath,
        brand,
        hint: `Ejecuta: python3 scripts/compute_capability_status.py --brand ${brand}`,
      });
    }
    // Otro error inesperado
    return errorResponse(
      `error leyendo _status-computed.json: ${(err as Error).message}`,
      500,
      { path: jsonPath }
    );
  }
}
