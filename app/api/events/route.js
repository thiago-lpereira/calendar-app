import { sql } from '@/lib/db';

export async function GET() {
  // Fetch events with their type label and assigned people
  const events = await sql`
    SELECT
      s.id, s.title, s.description, s.event_date, s.id_type,
      t.label AS type_label,
      COALESCE(
        json_agg(json_build_object('id', p.id, 'name', p.name, 'is_teacher', p.is_teacher))
        FILTER (WHERE p.id IS NOT NULL), '[]'
      ) AS people
    FROM schedule s
    LEFT JOIN type t ON t.id = s.id_type
    LEFT JOIN schedule_person sp ON sp.schedule_id = s.id
    LEFT JOIN person p ON p.id = sp.person_id
    GROUP BY s.id, t.label
    ORDER BY s.event_date
  `;
  return Response.json(events);
}

export async function POST(req) {
  const { title, description, eventDate, idType, personIds } = await req.json();
  if (!title?.trim() || !eventDate) {
    return Response.json({ error: 'Title and date required' }, { status: 400 });
  }

  const [event] = await sql`
    INSERT INTO schedule (title, description, event_date, id_type)
    VALUES (${title.trim()}, ${description || null}, ${eventDate}, ${idType || null})
    RETURNING *
  `;

  if (personIds?.length) {
    for (const pid of personIds) {
      await sql`
        INSERT INTO schedule_person (schedule_id, person_id) VALUES (${event.id}, ${pid})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  return Response.json(event);
}