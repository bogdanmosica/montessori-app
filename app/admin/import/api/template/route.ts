/**
 * Excel Template Download API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTemplate, getTemplateFileName } from '@/lib/utils/excel/template-generator';
import { ENTITY_TYPES, EntityType } from '@/lib/constants/import-constants';
import { verifyToken } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication using session cookie
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(sessionCookie.value);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get entity type from query params
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('type') as EntityType;

    // Validate entity type
    if (!entityType || !Object.values(ENTITY_TYPES).includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Generate template
    const buffer = generateTemplate(entityType);
    const fileName = getTemplateFileName(entityType);

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
