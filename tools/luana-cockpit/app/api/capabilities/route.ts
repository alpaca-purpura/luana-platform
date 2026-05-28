/**
 * GET /api/capabilities?brand=vitalia  → { capabilities: Capability[] }
 *
 * Lee todos los YAMLs (markdown con frontmatter) en
 * `{brand}/docs/product/capabilities/<module>/<slug>.yaml`.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { errorResponse } from '../_lib/responses';
import { readCapability } from '@/lib/cap-ledger';
import { globPaths } from '@/lib/fs-reader';
import { capabilitiesPath, getBrands } from '@/lib/workspace';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const brand = req.nextUrl.searchParams.get('brand');
  if (!brand) return errorResponse('query param "brand" requerido', 400);
  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  try {
    const baseDir = capabilitiesPath(brand);
    // glob: capabilities/*/*.yaml
    const files = await globPaths('*/*.yaml', baseDir);

    const capabilities = await Promise.all(
      files.map(async (abs) => {
        try {
          return await readCapability(abs);
        } catch {
          return null;
        }
      })
    );

    const valid = capabilities.filter((c): c is NonNullable<typeof c> => c !== null);
    return NextResponse.json({ capabilities: valid });
  } catch (err) {
    return errorResponse('error agregando capabilities', 500, {
      detail: (err as Error).message,
    });
  }
}

// Helper interno usado por otros endpoints
export function capYamlPath(brand: string, module: string, slug: string): string {
  return path.join(capabilitiesPath(brand), module, `${slug}.yaml`);
}
