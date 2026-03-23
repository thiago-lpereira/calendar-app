'use client';
import { useState, useEffect } from 'react';

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function toISO(year, month, day) {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function MonthGrid({ year, month, eventsByDate, onDayClick }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ flex: '1 1 160px', minWidth: 140 }}>
      <div style={{ fontWeight: 500, fontSize: '0.8rem', marginBottom: 4, color: '#555' }}>
        {MONTHS[month]}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {DAYS.map(d => (
          <div key={d} style={{ fontSize: '0.6rem', color: '#aaa', textAlign: 'center', paddingBottom: 2 }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const iso = toISO(year, month, day);
          const evts = eventsByDate[iso] || [];
          const hasHoliday  = evts.some(e => e.type_label === 'Holiday');
          const hasWorkday  = evts.some(e => e.type_label === 'Workday');
          return (
            <div
              key={day}
              onClick={() => evts.length && onDayClick(iso, evts)}
              style={{
                fontSize: '0.65rem',
                textAlign: 'center',
                padding: '2px 0',
                borderRadius: 3,
                cursor: evts.length ? 'pointer' : 'default',
                background: hasHoliday ? '#fde8e8' : hasWorkday ? '#e8f4fd' : 'transparent',
                color: hasHoliday ? '#c0392b' : hasWorkday ? '#1a6fa8' : 'inherit',
                fontWeight: evts.length ? 600 : 400,
                border: evts.length ? '1px solid ' + (hasHoliday ? '#f5b7b1' : '#a9cce3') : '1px solid transparent',
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const year = new Date().getFullYear();
  const [people, setPeople]   = useState([]);
  const [events, setEvents]   = useState([]);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddEvent,  setShowAddEvent]  = useState(false);
  const [dayPopup, setDayPopup] = useState(null); // { date, events }

  // Add person form state
  const [pName, setPName]         = useState('');
  const [pCode, setPCode]         = useState('');
  const [pTeacher, setPTeacher]   = useState(false);

  // Add event form state
  const [eTitle, setETitle]       = useState('');
  const [eDesc,  setEDesc]        = useState('');
  const [eDate,  setEDate]        = useState('');
  const [eType,  setEType]        = useState('1');
  const [ePeople, setEPeople]     = useState([]);

  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const [p, e] = await Promise.all([
      fetch('/api/people').then(r => r.json()),
      fetch('/api/events').then(r => r.json()),
    ]);
    setPeople(p);
    setEvents(e);
  };

  useEffect(() => { fetchAll(); }, []);

  const eventsByDate = events.reduce((acc, e) => {
    const key = e.event_date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const handleAddPerson = async () => {
    if (!pName.trim()) return;
    setSaving(true);
    await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: pName, code: pCode, isTeacher: pTeacher }),
    });
    setPName(''); setPCode(''); setPTeacher(false);
    setShowAddPerson(false);
    setSaving(false);
    fetchAll();
  };

  const handleAddEvent = async () => {
    if (!eTitle.trim() || !eDate) return;
    setSaving(true);
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: eTitle, description: eDesc,
        eventDate: eDate, idType: parseInt(eType),
        personIds: ePeople.map(Number),
      }),
    });
    setETitle(''); setEDesc(''); setEDate(''); setEType('1'); setEPeople([]);
    setShowAddEvent(false);
    setSaving(false);
    fetchAll();
  };

  const togglePerson = (id) => {
    setEPeople(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const inputStyle = {
    width: '100%', padding: '6px 8px', border: '1px solid #ddd',
    borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box', marginBottom: 8,
  };
  const btnPrimary = {
    padding: '7px 16px', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem',
  };
  const btnSecondary = {
    padding: '7px 16px', background: '#f3f4f6', color: '#374151',
    border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── LEFT SIDEBAR 25% ── */}
      <aside style={{
        width: '25%', minWidth: 180, maxWidth: 280, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid #e5e7eb', background: '#f9fafb', padding: '1rem',
      }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111' }}>People</h2>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {people.length === 0
            ? <p style={{ fontSize: '0.8rem', color: '#000000' }}>No people yet.</p>
            : people.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.4rem 0.5rem', borderRadius: 6, marginBottom: 4,
                  background: '#fff', border: '1px solid #e5e7eb',
                }}>
                  <span style={{ fontSize: '0.8rem', flex: 1, color: '#111' }}>
                    {p.name}
                    {p.code && <span style={{ color: '#000000', marginLeft: 4 }}>({p.code})</span>}
                  </span>
                  {p.is_teacher && (
                    <span style={{
                      fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af',
                      padding: '1px 6px', borderRadius: 99, fontWeight: 500,
                    }}>Teacher</span>
                  )}
                </div>
              ))
          }
        </div>

        {/* Bottom buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
          <button style={btnPrimary} onClick={() => setShowAddPerson(true)}>+ Add person</button>
          <button style={btnSecondary} onClick={() => setShowAddEvent(true)}>+ Add event</button>
        </div>
      </aside>

      {/* ── MAIN CALENDAR 75% ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Calendar {year}</h1>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:'#fde8e8', border:'1px solid #f5b7b1', display:'inline-block' }}/>
              Holiday
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:'#e8f4fd', border:'1px solid #a9cce3', display:'inline-block' }}/>
              Workday
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          {MONTHS.map((_, m) => (
            <MonthGrid
              key={m} year={year} month={m}
              eventsByDate={eventsByDate}
              onDayClick={(date, evts) => setDayPopup({ date, evts })}
            />
          ))}
        </div>
      </main>

      {/* ── MODAL OVERLAY helper ── */}
      {(showAddPerson || showAddEvent || dayPopup) && (
        <div
          onClick={() => { setShowAddPerson(false); setShowAddEvent(false); setDayPopup(null); }}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 10, padding: '1.25rem',
            width: 340, maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          }}>

            {/* Add Person modal */}
            {showAddPerson && <>
              <h3 style={{ margin:'0 0 1rem', fontSize:'1rem' }}>+Add person</h3>
              <input style={inputStyle} placeholder="Name *" value={pName} onChange={e => setPName(e.target.value)} />
              <input style={inputStyle} placeholder="Code" value={pCode} onChange={e => setPCode(e.target.value)} />
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.85rem', marginBottom:12 }}>
                <input type="checkbox" checked={pTeacher} onChange={e => setPTeacher(e.target.checked)} />
                Is teacher
              </label>
              <div style={{ display:'flex', gap:8 }}>
                <button style={btnPrimary} onClick={handleAddPerson} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button style={btnSecondary} onClick={() => setShowAddPerson(false)}>Cancel</button>
              </div>
            </>}

            {/* Add Event modal */}
            {showAddEvent && <>
              <h3 style={{ margin:'0 0 1rem', fontSize:'1rem' }}>+Add event</h3>
              <input style={inputStyle} placeholder="Title *" value={eTitle} onChange={e => setETitle(e.target.value)} />
              <textarea style={{...inputStyle, resize:'vertical', minHeight:60}} placeholder="Description" value={eDesc} onChange={e => setEDesc(e.target.value)} />
              <input style={inputStyle} type="date" value={eDate} onChange={e => setEDate(e.target.value)} />
              <select style={inputStyle} value={eType} onChange={e => setEType(e.target.value)}>
                <option value="1">Holiday</option>
                <option value="2">Workday</option>
              </select>

              <div style={{ fontSize:'0.8rem', fontWeight:500, marginBottom:6 }}>Assign people</div>
              {people.length === 0
                ? <p style={{ fontSize:'0.8rem', color:'#9ca3af', marginBottom:8 }}>No people added yet.</p>
                : people.map(p => (
                    <label key={p.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.82rem', marginBottom:5 }}>
                      <input
                        type="checkbox"
                        checked={ePeople.includes(p.id)}
                        onChange={() => togglePerson(p.id)}
                      />
                      {p.name}
                      {p.is_teacher && <span style={{ fontSize:'0.7rem', color:'#000000', background:'#dbeafe', padding:'1px 5px', borderRadius:99 }}>Teacher</span>}
                    </label>
                  ))
              }

              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button style={btnPrimary} onClick={handleAddEvent} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button style={btnSecondary} onClick={() => setShowAddEvent(false)}>Cancel</button>
              </div>
            </>}

            {/* Day detail popup */}
            {dayPopup && <>
              <h3 style={{ margin:'0 0 0.75rem', fontSize:'1rem', color:'#111' }}>{dayPopup.date}</h3>
              {dayPopup.evts.map(e => (
                <div key={e.id} style={{
                  marginBottom: 10, padding:'0.6rem 0.75rem', borderRadius:6,
                  background: e.type_label === 'Holiday' ? '#fde8e8' : '#e8f4fd',
                  border: '1px solid ' + (e.type_label === 'Holiday' ? '#f5b7b1' : '#a9cce3'),
                }}>
                  <div style={{ fontWeight:500, fontSize:'0.85rem', color:'#111' }}>{e.title}</div>
                  <div style={{ fontSize:'0.75rem', color:'#000000', marginTop:2 }}>{e.type_label}</div>
                  {e.description && <div style={{ fontSize:'0.78rem', color:'#000000', marginTop:4 }}>{e.description}</div>}
                  {e.people?.length > 0 && (
                    <div style={{ fontSize:'0.72rem', marginTop:5, color:'#000000' }}>
                      {e.people.map(p => p.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
              <button style={{...btnSecondary, marginTop:4, width:'100%'}} onClick={() => setDayPopup(null)}>Close</button>
            </>}

          </div>
        </div>
      )}
    </div>
  );
}