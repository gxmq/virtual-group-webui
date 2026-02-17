import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Direct fetch using env URL
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
    const result = await client.query('SELECT * FROM ops_floor_registry WHERE id = $1', [id]);
    await client.end();
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }
    
    return NextResponse.json({ floor: result.rows[0] });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
