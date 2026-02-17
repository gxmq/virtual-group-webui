import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { enabled } = await request.json();
    
    const dbUrl = process.env.CONTROL_DATABASE_URL || '';
    const url = new URL(dbUrl);
    
    const { Client } = require('pg');
    const client = new Client({
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', '')
    });
    
    await client.connect();
    
    const result = await client.query(
      'UPDATE ops_floor_registry SET enabled = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [enabled, enabled ? 'configured' : 'stopped', id]
    );
    
    await client.end();
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }
    
    return NextResponse.json({ floor: result.rows[0], message: enabled ? 'Floor enabled' : 'Floor disabled' });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
