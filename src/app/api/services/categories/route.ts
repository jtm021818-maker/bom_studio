import { NextResponse } from 'next/server';
import { SERVICE_CATEGORIES } from '@/core/validators/service';

/**
 * GET /api/services/categories — Get all service categories
 */
export async function GET() {
  return NextResponse.json(SERVICE_CATEGORIES);
}
