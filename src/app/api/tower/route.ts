import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.CONTROL_DATABASE_URL,
});

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, floor_no, display_name, company_name, status, health_score, 
             last_heartbeat_at, enabled
      FROM ops_floor_registry 
      ORDER BY floor_no
    `);
    
    return NextResponse.json({ floors: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch floors' }, { status: 500 });
  }
}
