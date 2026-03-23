import { sql } from '@/lib/db';

export async function GET() {
  const rows = await sql`SELECT * FROM person ORDER BY name`;
  return Response.json(rows);
}

export async function POST(req) {
  const { name, code, isTeacher } = await req.json();
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 });
  const [row] = await sql`
    INSERT INTO person (name, code, is_teacher)
    VALUES (${name.trim()}, ${code || null}, ${!!isTeacher})
    RETURNING *
  `;
  return Response.json(row);
}