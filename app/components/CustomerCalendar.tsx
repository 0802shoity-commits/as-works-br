"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '../lib/supabase';

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const pad2 = (n: number) => String(n).padStart(2, '0');
const toLocalDate = (iso: string) => new Date(iso).toLocaleDateString('sv-SE');

type Props = { onOpenCustomer?: (id: string) => void };

export default function CustomerCalendar({ onOpenCustomer }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [mode, setMode] = useState<'registered' | 'visit'>('registered');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('sv-SE'));

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: cData } = await supabase.from('customers').select('*').eq('user_id', user.id);
      setCustomers(cData || []);
      const { data: hData } = await supabase.from('customer_work_history').select('id, customer_id, work_type, work_date').eq('user_id', user.id);
      setHistory(hData || []);
      setLoading(false);
    };
    load();
  }, []);

  const customerById = useMemo(() => {
    const m: { [id: string]: any } = {};
    customers.forEach(c => { m[String(c.id)] = c; });
    return m;
  }, [customers]);

  // 日付 → その日のお客様（登録日 or 来店日）
  const byDate = useMemo(() => {
    const m: { [date: string]: { customer: any; works: string[] }[] } = {};
    if (mode === 'registered') {
      customers.forEach(c => {
        if (!c.created_at) return;
        const d = toLocalDate(c.created_at);
        (m[d] = m[d] || []).push({ customer: c, works: [] });
      });
    } else {
      const tmp: { [date: string]: { [cid: string]: string[] } } = {};
      history.forEach(h => {
        if (!h.work_date || !customerById[String(h.customer_id)]) return;
        const day = (tmp[h.work_date] = tmp[h.work_date] || {});
        (day[String(h.customer_id)] = day[String(h.customer_id)] || []).push(h.work_type);
      });
      Object.entries(tmp).forEach(([d, cs]) => {
        m[d] = Object.entries(cs).map(([cid, works]) => ({ customer: customerById[cid], works }));
      });
    }
    Object.values(m).forEach(list => list.sort((a, b) => (a.customer.name || '').localeCompare(b.customer.name || '', 'ja')));
    return m;
  }, [mode, customers, history, customerById]);

  const ym = `${year}-${pad2(month + 1)}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const todayStr = new Date().toLocaleDateString('sv-SE');

  const monthNew = customers.filter(c => c.created_at && toLocalDate(c.created_at).startsWith(ym)).length;
  const monthHist = history.filter(h => h.work_date?.startsWith(ym) && customerById[String(h.customer_id)]);
  const monthVisitors = new Set(monthHist.map(h => String(h.customer_id))).size;

  const accent = mode === 'registered' ? '#6366f1' : '#10b981';
  const accentBg = mode === 'registered' ? '#eef2ff' : '#ecfdf5';
  const selectedList = byDate[selectedDate] || [];

  const changeMonth = (diff: number) => {
    const d = new Date(year, month + diff, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth());
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>読み込み中...</div>;

  return (
    <div>
      <style>{`@keyframes calPop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => changeMonth(-1)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', fontSize: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>◀</button>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>{year}年 {month + 1}月</div>
          <button onClick={() => changeMonth(1)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', fontSize: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>▶</button>
          <button onClick={() => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth()); setSelectedDate(todayStr); }} style={{ padding: '6px 14px', borderRadius: '8px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>今日</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '10px', padding: '4px' }}>
            {([['registered', '📅 登録日', '#6366f1'], ['visit', '🔧 来店日', '#10b981']] as const).map(([m, label, color]) => (
              <div key={m} onClick={() => setMode(m)} style={{ padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', background: mode === m ? 'white' : 'transparent', color: mode === m ? color : '#888', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: '0.15s' }}>{label}</div>
            ))}
          </div>
        </div>
      </div>

      {/* 今月のサマリー */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { label: '今月の新規登録', value: `${monthNew}人`, color: '#6366f1', bg: '#eef2ff' },
          { label: '今月の来店', value: `${monthVisitors}人`, sub: `（延べ${monthHist.length}件）`, color: '#10b981', bg: '#ecfdf5' },
          { label: '顧客総数', value: `${customers.length}人`, color: '#374151', bg: 'white' },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 18px', borderRadius: '12px', background: s.bg, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: s.color }}>{s.value}<span style={{ fontSize: '11px', color: '#999', fontWeight: 'normal' }}>{s.sub || ''}</span></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* カレンダー */}
        <div style={{ flex: 1, background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {DAY_NAMES.map((d, i) => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', background: '#1a1a2e', color: i === 0 ? '#fca5a5' : i === 6 ? '#93c5fd' : 'white' }}>{d}</div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={i} style={{ minHeight: '96px', background: '#fafafa', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }} />;
              const ds = `${ym}-${pad2(d)}`;
              const list = byDate[ds] || [];
              const dow = i % 7;
              const isSel = ds === selectedDate;
              const isToday = ds === todayStr;
              return (
                <div key={i} onClick={() => setSelectedDate(ds)}
                  style={{ minHeight: '96px', padding: '6px', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: isSel ? accentBg : 'white', boxShadow: isSel ? `inset 0 0 0 2px ${accent}` : 'none', transition: 'background 0.15s', overflow: 'hidden' }}
                  onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = '#f8f9ff'; }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : '#333', ...(isToday ? { background: accent, color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } : {}) }}>{d}</span>
                    {list.length > 0 && <span style={{ fontSize: '10px', fontWeight: 'bold', background: accent, color: 'white', borderRadius: '10px', padding: '1px 7px' }}>{list.length}</span>}
                  </div>
                  {list.slice(0, 3).map(({ customer }) => (
                    <div key={customer.id} style={{ fontSize: '11px', fontWeight: 'bold', color: accent, background: accentBg, borderRadius: '4px', padding: '1px 5px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.name}</div>
                  ))}
                  {list.length > 3 && <div style={{ fontSize: '10px', color: '#888', paddingLeft: '4px' }}>他{list.length - 3}人</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 選択日の一覧 */}
        <div key={`${selectedDate}-${mode}`} style={{ width: '300px', flexShrink: 0, background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '18px', animation: 'calPop 0.25s ease', position: 'sticky', top: '0' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e' }}>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}</div>
          <div style={{ fontSize: '12px', color: accent, fontWeight: 'bold', marginTop: '2px', marginBottom: '14px' }}>{mode === 'registered' ? '新規登録' : '来店'} {selectedList.length}人</div>
          {selectedList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#bbb', fontSize: '13px' }}>この日の{mode === 'registered' ? '新規登録' : '来店'}はありません</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedList.map(({ customer, works }, idx) => (
                <div key={customer.id} onClick={() => onOpenCustomer?.(String(customer.id))}
                  style={{ padding: '10px 12px', borderRadius: '10px', border: '2px solid #eef0f5', borderLeft: `4px solid ${accent}`, cursor: onOpenCustomer ? 'pointer' : 'default', transition: '0.15s', animation: `calPop 0.25s ease ${idx * 0.03}s both` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent; (e.currentTarget as HTMLElement).style.background = accentBg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#eef0f5'; (e.currentTarget as HTMLElement).style.borderLeftColor = accent; (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a2e' }}>{customer.name}</span>
                    {onOpenCustomer && <span style={{ fontSize: '11px', color: accent }}>台帳 →</span>}
                  </div>
                  {customer.phone && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>📞 {customer.phone}</div>}
                  {customer.car_model && <div style={{ fontSize: '12px', color: '#6b7280' }}>🚗 {customer.car_model}{customer.car_number ? `・${customer.car_number}` : ''}</div>}
                  {works.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {works.map((w, i) => <span key={i} style={{ fontSize: '10px', fontWeight: 'bold', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '8px' }}>{w}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
