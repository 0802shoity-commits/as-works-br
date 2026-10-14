"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '../lib/supabase';

type Pattern = { code: string; label: string; start: string; end: string; breakMin?: number; color?: string };
type StaffRow = { name: string; skills: string };
type Sel = { r1: number; c1: number; r2: number; c2: number };

const PATTERN_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DEFAULT_PATTERNS: Pattern[] = [
  { code: 'A', label: 'Manhã', start: '08:00', end: '16:00', breakMin: 60, color: '#3b82f6' },
  { code: 'B', label: 'Integral', start: '09:00', end: '18:00', breakMin: 60, color: '#10b981' },
  { code: 'C', label: 'Tarde', start: '12:00', end: '21:00', breakMin: 60, color: '#f59e0b' },
  { code: 'D', label: 'Dia todo', start: '08:00', end: '21:00', breakMin: 60, color: '#8b5cf6' },
];

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const pad2 = (n: number) => String(n).padStart(2, '0');
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const spanMinutes = (start: string, end: string) => { let d = toMin(end) - toMin(start); if (d < 0) d += 1440; return d; };

// 一括ブロック（ダッシュボードと同じ判定）
const weekdayOf = (dateStr: string) => new Date(`${dateStr}T00:00:00`).getDay();
const blockAppliesOn = (b: any, dateStr: string) => {
  if ((b.excluded_dates || []).includes(dateStr)) return false;
  if (b.mode === 'dates') return (b.specific_dates || []).includes(dateStr);
  if (b.mode === 'weekly') {
    if (b.start_date && dateStr < b.start_date) return false;
    return (b.days || []).includes(weekdayOf(dateStr));
  }
  if (!b.start_date || !b.end_date) return false;
  if (dateStr < b.start_date || dateStr > b.end_date) return false;
  const days = b.days || [];
  return days.length === 0 || days.includes(weekdayOf(dateStr));
};

export default function ShiftManager() {
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [shiftData, setShiftData] = useState<{ [key: string]: any }>({});
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [appCount, setAppCount] = useState<{ [date: string]: number }>({});
  const [events, setEvents] = useState<{ [date: string]: string }>({});
  const [blocks, setBlocks] = useState<any[]>([]);
  const [required, setRequired] = useState<{ [dow: string]: number }>({});
  const [dashboardStaff, setDashboardStaff] = useState<string[]>([]);

  const [newStaffName, setNewStaffName] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [editingPatterns, setEditingPatterns] = useState(false);
  const [draftPatterns, setDraftPatterns] = useState<Pattern[]>([]);
  const [showRequired, setShowRequired] = useState(false);
  const [draftRequired, setDraftRequired] = useState<{ [dow: string]: number }>({});
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState('');
  const [shiftModal, setShiftModal] = useState<{ staff: string; date: string } | null>(null);
  const [shiftForm, setShiftForm] = useState({ startTime: '09:00', endTime: '18:00', isOff: false, shiftType: '' });
  const [syncSchedule, setSyncSchedule] = useState(true);
  const [scheduleSync, setScheduleSync] = useState(false);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  // セル選択（ドラッグで複数選択）
  const [sel, setSel] = useState<Sel | null>(null);
  const selecting = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const ym = `${year}-${pad2(month + 1)}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const dateOf = (d: number) => `${ym}-${pad2(d)}`;
  const dowOf = (d: number) => new Date(year, month, d).getDay();

  // ===== 読み込み =====
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSel(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      // Profissional（重複は1つにまとめる）
      let staffRes: any = await supabase.from('staff_members').select('name, skills, sort_order, id').eq('user_id', user.id).order('sort_order', { ascending: true }).order('id', { ascending: true });
      if (staffRes.error) staffRes = await supabase.from('staff_members').select('name, skills, id').eq('user_id', user.id).order('id', { ascending: true });
      const seen = new Set<string>();
      const list: StaffRow[] = [];
      (staffRes.data || []).forEach((s: any) => { if (s.name && !seen.has(s.name)) { seen.add(s.name); list.push({ name: s.name, skills: s.skills || '' }); } });
      setStaff(list);

      const { data: pData } = await supabase.from('user_settings').select('shift_patterns').eq('user_id', user.id).maybeSingle();
      const pList: Pattern[] = (pData?.shift_patterns && Array.isArray(pData.shift_patterns) && pData.shift_patterns.length > 0) ? pData.shift_patterns : DEFAULT_PATTERNS;
      setPatterns(pList.map((p, i) => ({ ...p, color: p.color || PATTERN_COLORS[i % PATTERN_COLORS.length], breakMin: p.breakMin ?? 0 })));

      const reqRes = await supabase.from('user_settings').select('shift_required').eq('user_id', user.id).maybeSingle();
      if (!reqRes.error && reqRes.data?.shift_required) setRequired(reqRes.data.shift_required);

      const startDate = `${ym}-01`;
      const endDate = `${ym}-${pad2(daysInMonth)}`;

      const { data: shifts } = await supabase.from('staff_shifts').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate);
      const map: { [key: string]: any } = {};
      (shifts || []).forEach((s: any) => { map[`${s.staff_name}_${s.date}`] = s; });
      setShiftData(map);

      const { data: appData } = await supabase.from('appointments').select('date, title').eq('user_id', user.id).gte('date', startDate).lte('date', endDate);
      const cMap: { [date: string]: number } = {};
      (appData || []).forEach((a: any) => { if (a.title !== 'Bloqueio') cMap[a.date] = (cMap[a.date] || 0) + 1; });
      setAppCount(cMap);

      const { data: evData } = await supabase.from('calendar_events').select('date, title').eq('user_id', user.id).gte('date', startDate).lte('date', endDate);
      const eMap: { [date: string]: string } = {};
      (evData || []).forEach((e: any) => { eMap[e.date] = e.title; });
      setEvents(eMap);

      const { data: attData } = await supabase.from('staff_attendance').select('staff_name').eq('user_id', user.id);
      setDashboardStaff([...new Set((attData || []).map((a: any) => a.staff_name))].filter(Boolean) as string[]);

      const { data: blockData } = await supabase.from('blocked_slots').select('*').eq('user_id', user.id);
      setBlocks(blockData || []);

      setLoading(false);
    };
    load();
  }, [year, month]);

  // ドラッグ選択のFim
  useEffect(() => {
    const up = () => { selecting.current = false; };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // ===== 計算 =====
  const patternOf = (s: any) => (s && !s.is_off && s.start_time) ? patterns.find(p => p.start === s.start_time && p.end === s.end_time) || null : null;
  const workMinutes = (s: any) => {
    if (!s || s.is_off || !s.start_time || !s.end_time) return 0;
    const p = patternOf(s);
    return Math.max(0, spanMinutes(s.start_time, s.end_time) - (p?.breakMin || 0));
  };
  const isWorking = (s: any) => !!(s && !s.is_off && s.start_time);

  const closedReason = (ds: string) => {
    const b = blocks.find(b => !b.staff_name && b.all_day && blockAppliesOn(b, ds));
    return b ? (b.reason || 'Fechado') : null;
  };
  const staffBlocked = (name: string, ds: string) => blocks.some(b => b.staff_name === name && b.all_day && blockAppliesOn(b, ds));

  const headcount = useMemo(() => {
    const res: { [d: number]: number } = {};
    days.forEach(d => { res[d] = staff.filter(s => isWorking(shiftData[`${s.name}_${dateOf(d)}`])).length; });
    return res;
  }, [staff, shiftData, year, month]);

  const minSel = sel ? { r1: Math.min(sel.r1, sel.r2), r2: Math.max(sel.r1, sel.r2), c1: Math.min(sel.c1, sel.c2), c2: Math.max(sel.c1, sel.c2) } : null;
  const isSelected = (r: number, c: number) => !!minSel && r >= minSel.r1 && r <= minSel.r2 && c >= minSel.c1 && c <= minSel.c2;
  const selectedCells = () => {
    if (!minSel) return [] as { staff: string; date: string }[];
    const cells: { staff: string; date: string }[] = [];
    for (let r = minSel.r1; r <= minSel.r2; r++) for (let c = minSel.c1; c <= minSel.c2; c++) if (staff[r]) cells.push({ staff: staff[r].name, date: dateOf(c + 1) });
    return cells;
  };
  const selCount = minSel ? (minSel.r2 - minSel.r1 + 1) * (minSel.c2 - minSel.c1 + 1) : 0;

  // ===== 保存処理 =====
  const upsertShifts = async (rows: any[]) => {
    if (!rows.length) return;
    const { error } = await supabase.from('staff_shifts').upsert(rows, { onConflict: 'user_id,staff_name,date' });
    if (error) { alert('Falha ao salvar: ' + error.message); return; }
    setShiftData(prev => { const n = { ...prev }; rows.forEach(r => { n[`${r.staff_name}_${r.date}`] = r; }); return n; });
  };

  const clearShifts = async (cells: { staff: string; date: string }[]) => {
    const byStaff: { [s: string]: string[] } = {};
    cells.forEach(c => { (byStaff[c.staff] = byStaff[c.staff] || []).push(c.date); });
    for (const s of Object.keys(byStaff)) {
      await supabase.from('staff_shifts').delete().eq('user_id', userId).eq('staff_name', s).in('date', byStaff[s]);
    }
    setShiftData(prev => { const n = { ...prev }; cells.forEach(c => { delete n[`${c.staff}_${c.date}`]; }); return n; });
  };

  const applyToSelection = async (kind: 'pattern' | 'off' | 'clear', p?: Pattern) => {
    const cells = selectedCells();
    if (!cells.length) return;
    if (kind === 'clear') { await clearShifts(cells); return; }
    const rows = cells.map(c => kind === 'off'
      ? { user_id: userId, staff_name: c.staff, date: c.date, start_time: null, end_time: null, is_off: true, shift_type: 'F' }
      : { user_id: userId, staff_name: c.staff, date: c.date, start_time: p!.start, end_time: p!.end, is_off: false, shift_type: p!.label });
    await upsertShifts(rows);
    // 1マスだけ選択中なら右へ進む（連続入力しやすく）
    if (selCount === 1 && minSel && minSel.c1 < daysInMonth - 1) setSel({ r1: minSel.r1, c1: minSel.c1 + 1, r2: minSel.r1, c2: minSel.c1 + 1 });
  };

  const openModal = (name: string, date: string) => {
    const s = shiftData[`${name}_${date}`];
    setShiftModal({ staff: name, date });
    setSyncSchedule(s?.shift_type?.includes('[Presente]') || false);
    setShiftForm(s ? { startTime: s.start_time || '09:00', endTime: s.end_time || '18:00', isOff: s.is_off || false, shiftType: s.shift_type || '' } : { startTime: '09:00', endTime: '18:00', isOff: false, shiftType: '' });
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!sel || shiftModal) return;
    const key = e.key;
    const matched = patterns.find(p => p.code.toUpperCase() === key.toUpperCase());
    if (matched) { e.preventDefault(); await applyToSelection('pattern', matched); return; }
    if (key === 'x' || key === 'X') { e.preventDefault(); await applyToSelection('off'); return; }
    if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); await applyToSelection('clear'); return; }
    if (key === 'Escape') { setSel(null); return; }
    if (key === 'Enter') { e.preventDefault(); const r = Math.min(sel.r1, sel.r2), c = Math.min(sel.c1, sel.c2); if (staff[r]) openModal(staff[r].name, dateOf(c + 1)); return; }
    const move: { [k: string]: [number, number] } = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    if (move[key]) {
      e.preventDefault();
      const [dr, dc] = move[key];
      const nr = Math.max(0, Math.min(staff.length - 1, sel.r2 + dr));
      const nc = Math.max(0, Math.min(daysInMonth - 1, sel.c2 + dc));
      setSel(e.shiftKey ? { ...sel, r2: nr, c2: nc } : { r1: nr, c1: nc, r2: nr, c2: nc });
    }
  };

  // ===== Profissional操作 =====
  const addStaff = async (nameRaw: string) => {
    const name = nameRaw.trim();
    if (!name) return;
    if (staff.some(s => s.name === name)) { alert(`"${name}" já está cadastrado(a)`); return; }
    const { error } = await supabase.from('staff_members').upsert({ user_id: userId, name, sort_order: staff.length }, { onConflict: 'user_id,name' });
    if (error) { const r = await supabase.from('staff_members').upsert({ user_id: userId, name }, { onConflict: 'user_id,name' }); if (r.error) { alert('Falha ao adicionar: ' + r.error.message); return; } }
    setStaff(prev => [...prev, { name, skills: '' }]);
    setNewStaffName('');
    setShowStaffDropdown(false);
  };

  const removeStaff = async (name: string) => {
    if (!window.confirm(`Remover "${name}" da equipe?\n\n• As escalas já preenchidas serão mantidas\n• Também sai da lista de equipe do painel`)) return;
    await supabase.from('staff_members').delete().eq('user_id', userId).eq('name', name);
    setStaff(prev => prev.filter(s => s.name !== name));
    setSel(null);
  };

  const moveStaff = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= staff.length) return;
    const next = [...staff];
    [next[idx], next[j]] = [next[j], next[idx]];
    setStaff(next);
    setSel(null);
    await Promise.all(next.map((s, i) => supabase.from('staff_members').update({ sort_order: i }).eq('user_id', userId).eq('name', s.name)));
  };

  const editSkills = async (s: StaffRow) => {
    const current = s.skills.split('\n').filter(Boolean).join(', ');
    const input = window.prompt(`Habilidades de ${s.name} (separadas por vírgula)`, current);
    if (input === null) return;
    const skills = input.split(/[、,，]/).map(x => x.trim()).filter(Boolean).join('\n');
    await supabase.from('staff_members').update({ skills }).eq('user_id', userId).eq('name', s.name);
    setStaff(prev => prev.map(x => x.name === s.name ? { ...x, skills } : x));
  };

  // ===== イベント =====
  const saveEvent = async (ds: string) => {
    const text = eventDraft.trim();
    if (text) {
      await supabase.from('calendar_events').upsert({ user_id: userId, date: ds, title: text }, { onConflict: 'user_id,date' });
      setEvents(prev => ({ ...prev, [ds]: text }));
    } else {
      await supabase.from('calendar_events').delete().eq('user_id', userId).eq('date', ds);
      setEvents(prev => { const n = { ...prev }; delete n[ds]; return n; });
    }
    setEditingEvent(null);
  };

  // ===== コピー =====
  const copyFromPrevMonth = async () => {
    if (!window.confirm('Copiar a escala do mês anterior para a mesma semana e dia da semana.\n(Ex.: 2ª quarta do mês passado → 2ª quarta deste mês)\n\nAs escalas já preenchidas neste mês serão substituídas. Continuar?')) return;
    const py = month === 0 ? year - 1 : year;
    const pm = month === 0 ? 11 : month - 1;
    const pYm = `${py}-${pad2(pm + 1)}`;
    const pEndDay = new Date(py, pm + 1, 0).getDate();
    const { data } = await supabase.from('staff_shifts').select('*').eq('user_id', userId).gte('date', `${pYm}-01`).lte('date', `${pYm}-${pad2(pEndDay)}`);
    const prev: { [k: string]: any } = {};
    (data || []).forEach((s: any) => { prev[`${s.staff_name}_${s.date}`] = s; });
    const firstDowPrev = new Date(py, pm, 1).getDay();
    const rows: any[] = [];
    days.forEach(d => {
      const nth = Math.floor((d - 1) / 7);
      let pd = 1 + ((dowOf(d) - firstDowPrev + 7) % 7) + nth * 7;
      while (pd > pEndDay) pd -= 7;
      staff.forEach(s => {
        const src = prev[`${s.name}_${pYm}-${pad2(pd)}`];
        if (src) rows.push({ user_id: userId, staff_name: s.name, date: dateOf(d), start_time: src.start_time, end_time: src.end_time, is_off: src.is_off, shift_type: src.shift_type });
      });
    });
    if (!rows.length) { alert('Nenhuma escala encontrada no mês anterior'); return; }
    await upsertShifts(rows);
    alert(`Escala do mês anterior copiada (${rows.length})`);
  };

  const copyFirstWeek = async () => {
    if (!window.confirm('Copiar a escala dos dias 1 a 7 para os mesmos dias da semana no resto do mês (a partir do dia 8).\n\nAs escalas já preenchidas a partir do dia 8 serão substituídas. Continuar?')) return;
    const rows: any[] = [];
    for (let d = 8; d <= daysInMonth; d++) {
      const src = ((d - 1) % 7) + 1;
      staff.forEach(s => {
        const sh = shiftData[`${s.name}_${dateOf(src)}`];
        if (sh) rows.push({ user_id: userId, staff_name: s.name, date: dateOf(d), start_time: sh.start_time, end_time: sh.end_time, is_off: sh.is_off, shift_type: sh.shift_type });
      });
    }
    if (!rows.length) { alert('Não há escala preenchida entre os dias 1 e 7'); return; }
    await upsertShifts(rows);
    alert(`Primeira semana copiada (${rows.length})`);
  };

  // ===== スケジュール連携 =====
  const syncToSchedule = async () => {
    const next = !scheduleSync;
    setScheduleSync(next);
    if (!next) return;
    const startDate = `${ym}-01`, endDate = `${ym}-${pad2(daysInMonth)}`;
    await supabase.from('staff_attendance').delete().eq('user_id', userId).gte('date', startDate).lte('date', endDate);
    const inserts: any[] = [];
    staff.forEach(s => days.forEach(d => { if (isWorking(shiftData[`${s.name}_${dateOf(d)}`])) inserts.push({ user_id: userId, staff_name: s.name, date: dateOf(d) }); }));
    if (inserts.length > 0) await supabase.from('staff_attendance').insert(inserts);
    alert(`Escala de ${pad2(month + 1)}/${year} aplicada à agenda (${inserts.length})`);
  };

  // ===== CSV =====
  const exportCsv = () => {
    const header = ['Profissional', 'Dias trabalhados', 'Horas trabalhadas', ...days.map(d => `${month + 1}/${d}(${DAY_NAMES[dowOf(d)]})`)];
    const lines = staff.map(s => {
      let mins = 0, cnt = 0;
      const cells = days.map(d => {
        const sh = shiftData[`${s.name}_${dateOf(d)}`];
        if (!sh) return '';
        if (sh.is_off) return 'F';
        mins += workMinutes(sh); cnt++;
        const p = patternOf(sh);
        return p ? p.code : `${sh.start_time}-${sh.end_time}`;
      });
      return [s.name, String(cnt), `${Math.floor(mins / 60)}:${pad2(mins % 60)}`, ...cells];
    });
    const footer = ['Pessoas no dia', '', '', ...days.map(d => String(headcount[d]))];
    const csv = [header, ...lines, footer].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `escala_${year}-${pad2(month + 1)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // ===== 見た目 =====
  const btn = (color: string, filled = false): React.CSSProperties => ({ padding: '7px 12px', borderRadius: '8px', border: `2px solid ${color}`, background: filled ? color : 'white', color: filled ? 'white' : color, cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' });
  const navBtn: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', fontSize: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' };
  const totalPersonDays = Object.values(headcount).reduce((a, b) => a + b, 0);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Carregando...</div>;

  return (
    <div>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 6mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          [data-shift-toolbar] { display: none !important; }
          [data-shift-wrap] { box-shadow: none !important; overflow: visible !important; }
          [data-shift-rowtools] { display: none !important; }
        }
        @keyframes shiftPop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ===== ツールバー ===== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button data-shift-toolbar onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} style={navBtn}>◀</button>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>{MONTHS_PT[month]} {year} <span style={{ fontSize: '14px', color: '#888', fontFamily: 'inherit' }}>Escala</span></div>
          <button data-shift-toolbar onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} style={navBtn}>▶</button>
        </div>
        <div data-shift-toolbar style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setEditingPatterns(true); setDraftPatterns(patterns.map(p => ({ ...p }))); }} style={btn('#f59e0b')}>⚙ Turnos</button>
          <button onClick={() => { setDraftRequired({ ...required }); setShowRequired(true); }} style={btn('#0ea5e9')}>👥 Mínimo por dia</button>
          <button onClick={copyFromPrevMonth} style={btn('#6366f1')}>📋 Copiar mês anterior</button>
          <button onClick={copyFirstWeek} style={btn('#6366f1')}>🔁 Repetir 1ª semana</button>
          <button onClick={() => window.print()} style={btn('#374151')}>🖨 Imprimir</button>
          <button onClick={exportCsv} style={btn('#059669')}>⬇ CSV</button>
          <label onClick={syncToSchedule} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '5px 10px', borderRadius: '8px', border: `2px solid ${scheduleSync ? '#10b981' : '#e5e7eb'}`, background: scheduleSync ? '#f0fdf4' : 'white' }}>
            <span style={{ fontSize: '11px', color: scheduleSync ? '#10b981' : '#888', fontWeight: 'bold', whiteSpace: 'nowrap' }}>📋 Sincronizar agenda</span>
            <div style={{ width: '32px', height: '18px', borderRadius: '9px', background: scheduleSync ? '#10b981' : '#e5e7eb', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: scheduleSync ? '16px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </label>
        </div>
      </div>

      {/* Profissional追加 ＋ パターン凡例 */}
      <div data-shift-toolbar style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {patterns.map(p => (
            <div key={p.code} style={{ padding: '4px 10px', borderRadius: '6px', background: `${p.color}1f`, border: `1px solid ${p.color}55`, fontSize: '11px', color: p.color, fontWeight: 'bold' }}>
              {p.code} = {p.label} ({p.start}–{p.end}{p.breakMin ? ` · intervalo ${p.breakMin} min` : ''})
            </div>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStaff(newStaffName)} placeholder="Nome" style={{ padding: '7px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', width: '130px', outline: 'none' }} />
            <button onClick={() => setShowStaffDropdown(!showStaffDropdown)} style={{ padding: '7px 10px', borderRadius: '8px', border: '2px solid #e5e7eb', background: showStaffDropdown ? '#eef2ff' : 'white', cursor: 'pointer', fontSize: '12px' }} title="Escolher da presença">▼</button>
            <button onClick={() => addStaff(newStaffName)} style={btn('#6366f1', true)}>＋ Adicionar</button>
          </div>
          {showStaffDropdown && (() => {
            const available = dashboardStaff.filter(n => !staff.some(s => s.name === n));
            return (
              <div style={{ position: 'absolute', top: '40px', right: 0, background: 'white', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '2px solid #e5e7eb', zIndex: 20, minWidth: '200px', maxHeight: '240px', overflowY: 'auto', animation: 'shiftPop 0.15s ease' }}>
                <div style={{ padding: '8px 12px', fontSize: '11px', color: '#888', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0' }}>📋 Equipe da presença</div>
                {available.length === 0 ? (
                  <div style={{ padding: '16px 12px', fontSize: '12px', color: '#bbb', textAlign: 'center' }}>{dashboardStaff.length === 0 ? 'Sem dados de presença' : 'Todos já adicionados'}</div>
                ) : available.map(n => (
                  <div key={n} onClick={() => addStaff(n)} style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #f8f8f8' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#eef2ff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}>{n}</div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 選択中のセルに一括入力 */}
      <div data-shift-toolbar style={{ minHeight: '40px', marginBottom: '8px' }}>
        {sel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#eef2ff', border: '2px solid #c7d2fe', borderRadius: '10px', flexWrap: 'wrap', animation: 'shiftPop 0.15s ease' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5', marginRight: '4px' }}>✓ {selCount} selecionada(s)</span>
            {patterns.map(p => (
              <button key={p.code} onClick={() => applyToSelection('pattern', p)} style={{ padding: '4px 10px', borderRadius: '6px', border: `2px solid ${p.color}`, background: `${p.color}1f`, color: p.color, cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{p.code} {p.label}</button>
            ))}
            <button onClick={() => applyToSelection('off')} style={{ padding: '4px 10px', borderRadius: '6px', border: '2px solid #9ca3af', background: '#f3f4f6', color: '#6b7280', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Folga</button>
            <button onClick={() => applyToSelection('clear')} style={{ padding: '4px 10px', borderRadius: '6px', border: '2px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Limpar</button>
            <button onClick={() => setSel(null)} style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '12px' }}>Desmarcar ✕</button>
          </div>
        )}
      </div>

      {/* ===== シフト表 ===== */}
      {staff.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>Nenhum profissional cadastrado</div>
          <div style={{ color: '#999', fontSize: '13px' }}>Adicione profissionais no campo acima, à direita</div>
        </div>
      ) : (
        <div ref={tableRef} tabIndex={0} onKeyDown={handleKeyDown} data-shift-wrap
          style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'auto', outline: 'none', userSelect: 'none' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '130px' }} />
              {days.map(d => <col key={d} />)}
              <col style={{ width: '64px' }} />
            </colgroup>
            <thead>
              {/* イベント行（細め） */}
              <tr>
                <th style={{ padding: '0 8px', background: '#fffbeb', fontSize: '11px', fontWeight: 'bold', color: '#92400e', textAlign: 'left', borderBottom: '1px solid #fde68a', height: '26px' }}>📌 Eventos</th>
                {days.map(d => {
                  const ds = dateOf(d);
                  const evt = events[ds];
                  return (
                    <th key={d} onClick={() => { setEditingEvent(ds); setEventDraft(evt || ''); }} title={evt || 'Clique para adicionar evento'}
                      style={{ padding: '0 1px', background: evt ? '#fef3c7' : '#fffdf5', fontSize: '10px', color: '#92400e', borderBottom: '1px solid #fde68a', borderRight: '1px solid #fdf6dc', cursor: 'pointer', height: '26px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
                      {editingEvent === ds ? (
                        <input autoFocus value={eventDraft} onChange={e => setEventDraft(e.target.value)} onBlur={() => saveEvent(ds)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingEvent(null); }}
                          style={{ position: 'relative', zIndex: 5, width: '120px', padding: '2px 4px', border: '2px solid #f59e0b', borderRadius: '4px', fontSize: '11px', outline: 'none' }} />
                      ) : (evt || '')}
                    </th>
                  );
                })}
                <th style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }} />
              </tr>
              {/* 日付行 */}
              <tr>
                <th style={{ padding: '6px 8px', background: '#1a1a2e', color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'left' }}>Profissional</th>
                {days.map(d => {
                  const dow = dowOf(d);
                  const ds = dateOf(d);
                  const cnt = appCount[ds] || 0;
                  const closed = closedReason(ds);
                  const isToday = new Date().toLocaleDateString('sv-SE') === ds;
                  return (
                    <th key={d} title={closed ? `${closed}` : undefined} style={{ padding: '3px 0', background: closed ? '#e5e7eb' : isToday ? '#e0e7ff' : (dow === 0 ? '#fef2f2' : dow === 6 ? '#eff6ff' : '#f8f9fa'), textAlign: 'center', fontSize: '10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #eef0f5' }}>
                      <div style={{ fontWeight: 'bold', fontSize: isToday ? '12px' : '11px', color: closed ? '#9ca3af' : dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : '#333' }}>{d}</div>
                      <div style={{ color: closed ? '#9ca3af' : dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : '#999', fontSize: '9px' }}>{DAY_NAMES[dow]}</div>
                      {closed ? <div style={{ fontSize: '8px', color: '#6b7280', fontWeight: 'bold' }}>Fechado</div>
                        : cnt > 0 ? <div title={`${cnt} agendamento(s)`} style={{ fontSize: '8px', background: '#6366f1', color: 'white', borderRadius: '6px', padding: '0 4px', display: 'inline-block', marginTop: '1px' }}>{cnt}</div> : null}
                    </th>
                  );
                })}
                <th style={{ padding: '3px 2px', background: '#1a1a2e', color: 'white', fontSize: '10px', fontWeight: 'bold', textAlign: 'center' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s, r) => {
                let mins = 0, workDays = 0;
                days.forEach(d => { const sh = shiftData[`${s.name}_${dateOf(d)}`]; if (isWorking(sh)) { workDays++; mins += workMinutes(sh); } });
                const skills = s.skills.split('\n').filter(Boolean);
                const rowBg = r % 2 === 0 ? 'white' : '#fafbfc';
                return (
                  <tr key={s.name} style={{ background: rowBg }} onMouseEnter={() => setHoverRow(r)} onMouseLeave={() => setHoverRow(null)}>
                    {/* Nomeセル */}
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #f0f0f0', borderRight: '2px solid #e5e7eb', background: rowBg, position: 'relative', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1a1a2e', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                        {hoverRow === r && (
                          <span data-shift-rowtools style={{ display: 'flex', gap: '2px', animation: 'shiftPop 0.12s ease' }}>
                            <span onClick={() => moveStaff(r, -1)} title="Subir" style={{ cursor: r === 0 ? 'default' : 'pointer', fontSize: '10px', color: r === 0 ? '#ddd' : '#6366f1', padding: '0 2px' }}>▲</span>
                            <span onClick={() => moveStaff(r, 1)} title="Descer" style={{ cursor: r === staff.length - 1 ? 'default' : 'pointer', fontSize: '10px', color: r === staff.length - 1 ? '#ddd' : '#6366f1', padding: '0 2px' }}>▼</span>
                            <span onClick={() => removeStaff(s.name)} title="Remover da equipe" style={{ cursor: 'pointer', fontSize: '12px', color: '#ef4444', padding: '0 2px', fontWeight: 'bold' }}>×</span>
                          </span>
                        )}
                      </div>
                      <div onClick={() => editSkills(s)} title="Clique para editar habilidades" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '3px', cursor: 'pointer', minHeight: '14px' }}>
                        {skills.length === 0
                          ? <span data-shift-rowtools style={{ fontSize: '9px', color: '#c0c4d0' }}>＋Habilidade</span>
                          : skills.map(k => <span key={k} style={{ fontSize: '9px', background: '#eef2ff', color: '#4f46e5', padding: '1px 5px', borderRadius: '8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{k}</span>)}
                      </div>
                    </td>
                    {/* シフトセル */}
                    {days.map((d, c) => {
                      const ds = dateOf(d);
                      const sh = shiftData[`${s.name}_${ds}`];
                      const dow = dowOf(d);
                      const closed = closedReason(ds) || (staffBlocked(s.name, ds) ? 'F' : null);
                      const p = patternOf(sh);
                      const selected = isSelected(r, c);
                      let bg = dow === 0 ? '#fef2f2' : dow === 6 ? '#eff6ff' : 'transparent';
                      if (closed && !sh) bg = 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 4px, #e5e7eb 4px, #e5e7eb 8px)';
                      if (sh?.is_off) bg = '#f3f4f6';
                      else if (p) bg = `${p.color}22`;
                      else if (isWorking(sh)) bg = '#eef2ff';
                      return (
                        <td key={d}
                          onMouseDown={(e) => { e.preventDefault(); selecting.current = true; tableRef.current?.focus(); setSel(e.shiftKey && sel ? { ...sel, r2: r, c2: c } : { r1: r, c1: c, r2: r, c2: c }); }}
                          onMouseEnter={() => { if (selecting.current && sel) setSel({ ...sel, r2: r, c2: c }); }}
                          onDoubleClick={() => openModal(s.name, ds)}
                          style={{ padding: '2px 0', textAlign: 'center', borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #eef0f5', cursor: 'cell', verticalAlign: 'middle', height: '44px', background: bg, boxShadow: selected ? 'inset 0 0 0 2px #6366f1' : 'none', position: 'relative' }}>
                          {selected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.12)', pointerEvents: 'none' }} />}
                          {sh?.is_off ? (
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' }}>F</div>
                          ) : p ? (
                            <>
                              <div style={{ fontSize: '15px', fontWeight: 'bold', color: p.color, lineHeight: 1.1 }}>{p.code}</div>
                              <div style={{ fontSize: '8px', color: '#777', lineHeight: 1.2 }}>{p.start}<br />{p.end}</div>
                            </>
                          ) : isWorking(sh) ? (
                            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1a1a2e', lineHeight: 1.25 }}>{sh.start_time}<br />–<br />{sh.end_time}</div>
                          ) : closed ? (
                            <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold' }}>{closed === 'F' ? 'F' : ''}</div>
                          ) : (
                            <div style={{ fontSize: '14px', color: '#e5e7eb' }}>·</div>
                          )}
                          {sh?.shift_type?.includes('[Presente]') && <div style={{ fontSize: '7px', color: '#10b981' }}>●</div>}
                        </td>
                      );
                    })}
                    {/* Total */}
                    <td style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', background: r % 2 === 0 ? '#f0f0ff' : '#eae8ff', borderLeft: '2px solid #e5e7eb' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#6366f1' }}>{Math.floor(mins / 60)}h{mins % 60 ? <span style={{ fontSize: '9px' }}>{mins % 60}m</span> : null}</div>
                      <div style={{ fontSize: '9px', color: '#888' }}>{workDays} dias</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {/* Pessoas no dia */}
              <tr>
                <td style={{ padding: '6px 8px', background: '#1a1a2e', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>👥 Pessoas no dia</td>
                {days.map(d => {
                  const ds = dateOf(d);
                  const cnt = headcount[d];
                  const req = Number(required[String(dowOf(d))] || 0);
                  const closed = closedReason(ds);
                  const short = !closed && req > 0 && cnt < req;
                  const ok = !closed && req > 0 && cnt >= req;
                  return (
                    <td key={d} title={short ? `Faltam ${req - cnt} pessoa(s)` : undefined} style={{ textAlign: 'center', padding: '4px 0', borderTop: '2px solid #e5e7eb', borderRight: '1px solid #eef0f5', background: closed ? '#e5e7eb' : short ? '#fee2e2' : ok ? '#ecfdf5' : '#f8f9fa' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: closed ? '#9ca3af' : short ? '#dc2626' : ok ? '#059669' : '#333' }}>{closed ? '-' : cnt}</div>
                      {!closed && req > 0 && <div style={{ fontSize: '8px', color: short ? '#dc2626' : '#888' }}>/{req}</div>}
                    </td>
                  );
                })}
                <td style={{ textAlign: 'center', background: '#1a1a2e', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{totalPersonDays}<div style={{ fontSize: '8px', opacity: 0.7 }}>pessoas-dia</div></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* 凡例・操作説明 */}
      <div data-shift-toolbar style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '11px', color: '#888', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#6366f1', fontWeight: 'bold' }}>🖱 Arraste para selecionar → teclas: {patterns.map(p => p.code).join('/')}=turno　X=folga　Del=limpar　Enter=detalhes　Setas para mover (Shift+setas para intervalo)</span>
        <span>▨ Fechado (bloqueio)</span>
        <span>Passe o mouse no nome para reordenar ▲▼ ou remover ×</span>
      </div>

      {/* ===== シフト詳細モーダル ===== */}
      {shiftModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShiftModal(null)}>
          <div style={{ width: '400px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>📅 Turno</span><span onClick={() => setShiftModal(null)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span></div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{shiftModal.staff} · {shiftModal.date}</div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <div onClick={() => setShiftForm({ ...shiftForm, isOff: !shiftForm.isOff })} style={{ width: '44px', height: '24px', borderRadius: '12px', background: shiftForm.isOff ? '#ef4444' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}><div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: shiftForm.isOff ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} /></div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: shiftForm.isOff ? '#ef4444' : '#333' }}>{shiftForm.isOff ? 'Folga' : 'Trabalha'}</span>
              </label>
            </div>
            {!shiftForm.isOff && (<>
              {patterns.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Escolher turno</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '11px', color: syncSchedule ? '#10b981' : '#999', fontWeight: 'bold' }}>📋 Marcar presença</span>
                      <div onClick={() => setSyncSchedule(!syncSchedule)} style={{ width: '36px', height: '20px', borderRadius: '10px', background: syncSchedule ? '#10b981' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: syncSchedule ? '18px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} /></div>
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                    {patterns.map(p => { const active = shiftForm.startTime === p.start && shiftForm.endTime === p.end; return (
                      <button key={p.code} onClick={() => setShiftForm({ ...shiftForm, startTime: p.start, endTime: p.end, shiftType: p.label })} style={{ padding: '8px 6px', borderRadius: '8px', border: `2px solid ${active ? p.color : '#e5e7eb'}`, background: active ? `${p.color}1f` : 'white', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: p.color }}>{p.code}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>{p.label}</div>
                        <div style={{ fontSize: '9px', color: '#aaa' }}>{p.start}–{p.end}</div>
                      </button>); })}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '16px' }}><div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>Tipo de turno (opcional)</div><input value={shiftForm.shiftType} onChange={e => setShiftForm({ ...shiftForm, shiftType: e.target.value })} placeholder="Ex.: Manhã, Tarde, Dia todo" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} /></div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>Início</div><input type="time" step={900} value={shiftForm.startTime} onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>Fim</div><input type="time" step={900} value={shiftForm.endTime} onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} /></div>
              </div>
            </>)}
            <div style={{ display: 'flex', gap: '10px' }}>
              {shiftData[`${shiftModal.staff}_${shiftModal.date}`] && (
                <button onClick={async () => { await clearShifts([{ staff: shiftModal.staff, date: shiftModal.date }]); await supabase.from('staff_attendance').delete().eq('user_id', userId).eq('staff_name', shiftModal.staff).eq('date', shiftModal.date); setShiftModal(null); }} style={{ padding: '12px 16px', borderRadius: '10px', border: '2px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Excluir</button>
              )}
              <button onClick={() => setShiftModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button onClick={async () => {
                if (!shiftModal) return;
                const { staff: name, date } = shiftModal;
                const typeToSave = syncSchedule ? (shiftForm.shiftType.includes('[Presente]') ? shiftForm.shiftType : (shiftForm.shiftType + ' [Presente]').trim()) : shiftForm.shiftType.replace('[Presente]', '').trim();
                if (shiftForm.isOff) {
                  await upsertShifts([{ user_id: userId, staff_name: name, date, start_time: null, end_time: null, is_off: true, shift_type: 'F' }]);
                  await supabase.from('staff_attendance').delete().eq('user_id', userId).eq('staff_name', name).eq('date', date);
                } else {
                  await upsertShifts([{ user_id: userId, staff_name: name, date, start_time: shiftForm.startTime, end_time: shiftForm.endTime, is_off: false, shift_type: typeToSave }]);
                  if (syncSchedule) await supabase.from('staff_attendance').upsert({ user_id: userId, staff_name: name, date }, { onConflict: 'user_id,staff_name,date' });
                  else await supabase.from('staff_attendance').delete().eq('user_id', userId).eq('staff_name', name).eq('date', date);
                }
                setShiftModal(null);
                tableRef.current?.focus();
              }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>💾 Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== パターン設定モーダル ===== */}
      {editingPatterns && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingPatterns(false)}>
          <div style={{ width: '640px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}><span>⚙ Configurar turnos</span><span onClick={() => setEditingPatterns(false)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span></div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Defina código (tecla), nome, horário, intervalo e cor. O intervalo é descontado das horas trabalhadas.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '54px 84px 1fr 14px 1fr 80px 44px 40px', gap: '6px', fontSize: '11px', color: '#999', fontWeight: 'bold', marginBottom: '4px', padding: '0 2px' }}>
              <span>Código</span><span>Nome</span><span>Início</span><span /><span>Fim</span><span>Interv. (min)</span><span>Cor</span><span />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {draftPatterns.map((p, idx) => {
                const upd = (patch: Partial<Pattern>) => { const n = [...draftPatterns]; n[idx] = { ...n[idx], ...patch }; setDraftPatterns(n); };
                const inp: React.CSSProperties = { padding: '8px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' };
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '54px 84px 1fr 14px 1fr 80px 44px 40px', gap: '6px', alignItems: 'center' }}>
                    <input value={p.code} onChange={e => upd({ code: e.target.value.toUpperCase().slice(0, 1) })} placeholder="A" style={{ ...inp, fontSize: '16px', fontWeight: 'bold', textAlign: 'center', color: p.color, borderColor: p.color }} />
                    <input value={p.label} onChange={e => upd({ label: e.target.value })} placeholder="Manhã" style={inp} />
                    <input type="time" value={p.start} onChange={e => upd({ start: e.target.value })} style={inp} />
                    <span style={{ color: '#999', textAlign: 'center' }}>–</span>
                    <input type="time" value={p.end} onChange={e => upd({ end: e.target.value })} style={inp} />
                    <input type="number" min={0} step={15} value={p.breakMin ?? 0} onChange={e => upd({ breakMin: Number(e.target.value) })} style={inp} />
                    <input type="color" value={p.color || '#6366f1'} onChange={e => upd({ color: e.target.value })} style={{ width: '40px', height: '36px', border: '2px solid #e5e7eb', borderRadius: '8px', padding: '2px', cursor: 'pointer' }} />
                    <button onClick={() => setDraftPatterns(draftPatterns.filter((_, i) => i !== idx))} style={{ height: '36px', borderRadius: '8px', border: '2px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '12px' }}>※ O código é uma letra do teclado (evite X, que é usado para folga)</div>
            <button onClick={() => setDraftPatterns([...draftPatterns, { code: String.fromCharCode(65 + draftPatterns.length), label: '', start: '09:00', end: '18:00', breakMin: 60, color: PATTERN_COLORS[draftPatterns.length % PATTERN_COLORS.length] }])} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px dashed #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>＋ Adicionar turno</button>
            <button onClick={async () => {
              const cleaned = draftPatterns.filter(p => p.code && p.start && p.end);
              const codes = cleaned.map(p => p.code);
              if (new Set(codes).size !== codes.length) { alert('Há códigos repetidos'); return; }
              if (codes.includes('X')) { alert('O código X é reservado para folga'); return; }
              setPatterns(cleaned);
              await supabase.from('user_settings').upsert({ user_id: userId, shift_patterns: cleaned, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
              setEditingPatterns(false);
            }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>💾 Salvar</button>
          </div>
        </div>
      )}

      {/* ===== 必要人数設定モーダル ===== */}
      {showRequired && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRequired(false)}>
          <div style={{ width: '460px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}><span>👥 Mínimo de pessoas por dia da semana</span><span onClick={() => setShowRequired(false)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span></div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '18px' }}>Dias com equipe insuficiente ficam em vermelho no rodapé da escala (0 = não verificar)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '20px' }}>
              {DAY_NAMES.map((dn, i) => (
                <div key={dn} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#333' }}>{dn}</div>
                  <input type="number" min={0} max={50} value={draftRequired[String(i)] ?? 0} onChange={e => setDraftRequired({ ...draftRequired, [String(i)]: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 2px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', textAlign: 'center', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
            </div>
            <button onClick={async () => {
              const { error } = await supabase.from('user_settings').upsert({ user_id: userId, shift_required: draftRequired, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
              if (error) { alert('Falha ao salvar: ' + error.message + '\n(Verifique se o SQL foi executado no Supabase)'); return; }
              setRequired(draftRequired);
              setShowRequired(false);
            }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>💾 Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}
