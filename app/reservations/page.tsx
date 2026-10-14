"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';
import { BUSINESS_TYPES, getBusinessType } from '../lib/businessTypes';
import UpgradeModal from "../components/UpgradeModal";

type CustomerAction = {
  id: string;
  customer_id: string;
  customer_name: string;
  action_type: string;
  scheduled_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [activeMenu, setActiveMenu] = useState('reservations');
  const router = useRouter();
  const supabase = createClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const [actions, setActions] = useState<CustomerAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<'pending' | 'done' | 'all'>('pending');
  const [businessType, setBusinessType] = useState('car');
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [actionCustomerInfo, setActionCustomerInfo] = useState<{ [customerId: string]: any }>({});

  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);

  const [savedCategories, setSavedCategories] = useState<any[]>([]);
  const [fieldEditItem, setFieldEditItem] = useState<{ category: string; item: any } | null>(null);
  const [draftFields, setDraftFields] = useState<{ label: string }[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>(['車検案内', 'フォローアップ連絡', '定期メンテナンス案内', '見積もり送付', 'お礼の連絡', 'その他']);
  const [openFieldSettings, setOpenFieldSettings] = useState(false);
  const [openActionSettings, setOpenActionSettings] = useState(false);
  const [actionEditCat, setActionEditCat] = useState<string | null>(null);
  const [draftActionTypes, setDraftActionTypes] = useState<string[]>([]);

  // 車検満了日
  const [inspectionCustomers, setInspectionCustomers] = useState<any[]>([]);
  const [inspectionFrom, setInspectionFrom] = useState('');
  const [inspectionTo, setInspectionTo] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      const { data: planData } = await supabase.from('user_plans').select('plan').eq('user_id', user.id).single();
      if (planData?.plan !== 'premium') { router.push('/dashboard'); return; }
      const { data } = await supabase.from('customer_reservations').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
      if (data) setReservations(data);
      const { data: settingsData } = await supabase.from('user_settings').select('business_type').eq('user_id', user.id).single();
      if (settingsData?.business_type) setBusinessType(settingsData.business_type);
      const { data: catData } = await supabase.from('work_categories').select('categories').eq('user_id', user.id).single();
      if (catData?.categories) setSavedCategories(catData.categories);
      const { data: atData } = await supabase.from('user_settings').select('action_types').eq('user_id', user.id).single();
      if (atData?.action_types && Array.isArray(atData.action_types) && atData.action_types.length > 0) setActionTypes(atData.action_types);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeMenu !== 'actions') return;
    const fetchActions = async () => {
      setActionsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setActionsLoading(false); return; }
      const { data } = await supabase
        .from('customer_actions')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true, nullsFirst: false });
      if (data) {
        setActions(data);
        const customerIds = [...new Set(data.map((a: any) => a.customer_id))].filter(Boolean);
        if (customerIds.length > 0) {
          const { data: custData } = await supabase
            .from('customers')
            .select('id, phone, car_model, car_number, address')
            .in('id', customerIds);
          if (custData) {
            const map: { [key: string]: any } = {};
            custData.forEach((c: any) => { map[String(c.id)] = c; });
            setActionCustomerInfo(map);
          }
        }
      }
      setActionsLoading(false);
    };
    fetchActions();
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'message') return;
    const fetchFeedback = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('feedback_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setFeedbackHistory(data);
    };
    fetchFeedback();
  }, [activeMenu]);

  // 車検満了日データ取得
  useEffect(() => {
    if (activeMenu !== 'inspection') return;
    const fetchInspection = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, car_model, car_number, inspection_date, custom_fields')
        .eq('user_id', user.id)
        .not('inspection_date', 'is', null)
        .order('inspection_date', { ascending: true });
      if (data) setInspectionCustomers(data);
    };
    fetchInspection();
  }, [activeMenu]);

  const markActionDone = async (id: string) => {
    await supabase.from('customer_actions').update({ status: 'done' }).eq('id', id);
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'done' } : a));
  };

  const deleteAction = async (id: string) => {
    if (!window.confirm('このアクションを削除しますか？')) return;
    await supabase.from('customer_actions').delete().eq('id', id);
    setActions(prev => prev.filter(a => a.id !== id));
  };

  const sendFeedback = async () => {
    if (!feedbackTitle.trim() || !feedbackContent.trim()) { alert('タイトルと内容を入力してください'); return; }
    setFeedbackSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    const typeLabel = { bug: '🐛 不具合報告', feature: '🆕 機能の要望', other: '💬 その他' }[feedbackType];
    const { data } = await supabase.from('feedback_messages').insert({
      user_id: user?.id, type: feedbackType, title: feedbackTitle, content: feedbackContent,
    }).select().single();
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '1082f8d3-5a20-45fd-b0bf-8c196e30b778',
          subject: `[A-Works] ${typeLabel}: ${feedbackTitle}`, from_name: 'A-Works 通知',
          送信者: user?.email || '不明', 種類: typeLabel, タイトル: feedbackTitle, 内容: feedbackContent,
        }),
      });
    } catch (e) {}
    if (data) setFeedbackHistory(prev => [data, ...prev]);
    setFeedbackTitle(''); setFeedbackContent(''); setFeedbackSending(false);
    setFeedbackSent(true); setTimeout(() => setFeedbackSent(false), 3000);
  };

  const saveDetailFields = async (categoryName: string, itemTitle: string, fields: { label: string }[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updated = savedCategories.map(cat =>
      cat.category === categoryName
        ? { ...cat, items: (cat.items || []).map((i: any) => i.title === itemTitle ? { ...i, detailFields: fields } : i) }
        : cat
    );
    setSavedCategories(updated);
    await supabase.from('work_categories').upsert({ user_id: user.id, categories: updated, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  };

  const saveActionTypesForCat = async (categoryName: string, types: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updated = savedCategories.map(cat =>
      cat.category === categoryName ? { ...cat, actionTypes: types } : cat
    );
    setSavedCategories(updated);
    await supabase.from('work_categories').upsert({ user_id: user.id, categories: updated, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  };

  const confirmReservation = async (id: number) => {
    await supabase.from('customer_reservations').update({ status: 'confirmed' }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'confirmed' } : r));
  };

  const deleteReservation = async (id: number) => {
    if (!window.confirm('この予約を削除しますか？')) return;
    await supabase.from('customer_reservations').delete().eq('id', id);
    setReservations(prev => prev.filter(r => r.id !== id));
  };

  const addToSchedule = async (res: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [hour, minute] = res.preferred_time.split(':').map(Number);
    const startMins = hour * 60 + minute;
    await supabase.from('appointments').insert({
      id: Date.now(), user_id: user.id, staff: '未割り当て',
      title: res.work_type, date: res.preferred_date,
      start_time: startMins, end_time: startMins + 60,
      customer_name: res.customer_name, car_model: res.car_model, notes: res.notes || '',
    });
    await confirmReservation(res.id);
    alert(`${res.preferred_date} ${res.preferred_time} に予定を追加しました！`);
  };

  const filtered = reservations.filter(r => {
    const matchFilter = filter === 'all' ? true : r.status === filter;
    if (!searchQuery) return matchFilter;
    const q = searchQuery.toLowerCase();
    if (searchType === 'name') return matchFilter && r.customer_name?.toLowerCase().includes(q);
    if (searchType === 'phone') return matchFilter && r.phone?.includes(q);
    return matchFilter;
  });

  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const pendingActionsCount = actions.filter(a => a.status === 'pending').length;

  const menuItems = [
    { key: 'reservations', icon: '📋', label: '予約一覧' },
    { key: 'register', icon: '✏️', label: '顧客登録' },
    { key: 'customers', icon: '👤', label: '顧客台帳' },
    ...(businessType === 'car' ? [{ key: 'inspection', icon: '🚗', label: '車検満了日' }] : []),
    { key: 'message', icon: '💬', label: 'メッセージ' },
    { key: 'billing', icon: '💴', label: '請求管理' },
    { key: 'settings', icon: '⚙️', label: '設定' },
  ];

  const getDateStyle = (date: string | null) => {
    if (!date) return { color: '#999', label: '期日未定' };
    const diff = Math.floor((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { color: '#ef4444', label: `${date}（期限切れ）` };
    if (diff <= 7) return { color: '#f59e0b', label: `${date}（あと${diff}日）` };
    return { color: '#6366f1', label: `${date}（あと${diff}日）` };
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; filter: brightness(1.2); } 50% { opacity: 0.3; filter: brightness(0.4); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: '160px', height: '160px', borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#ff1493', borderRightColor: '#ff69b4', animation: 'spin 1.2s linear infinite' }} />
        <div style={{ position: 'absolute', width: '140px', height: '140px', borderRadius: '50%', border: '3px solid transparent', borderBottomColor: '#ff1493', borderLeftColor: '#ff69b4', animation: 'spin 1.8s linear infinite reverse' }} />
        <img src="/awwork.png" alt="Loading" style={{ width: '90px', height: '90px', objectFit: 'contain', animation: 'pulse 2s ease-in-out infinite' }} />
      </div>
      <div style={{ marginTop: '30px', color: '#ff1493', fontSize: '14px', fontWeight: 'bold', letterSpacing: '3px', animation: 'pulse 2s ease-in-out infinite' }}>お待ちください...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif", background: '#f8f9fa' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-print-area], [data-print-area] * { visibility: visible; }
          [data-print-area] { position: absolute; left: 0; top: 0; width: 100%; }
          button, [data-no-print] { display: none !important; }
        }
      `}</style>

      {/* サイドバー */}
      <div style={{ width: '220px', background: 'linear-gradient(180deg, #1a1a2e 0%, #0f3460 100%)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }} data-no-print>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
            <img src="/awwork.png" alt="As-Works" style={{ width: '50px', height: '50px', objectFit: 'contain', filter: 'invert(1)', marginRight: '-5px' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', fontFamily: 'Arial, sans-serif' }}>-Works</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>管理システム</div>
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: '600', letterSpacing: '1px' }}>SEARCH</div>
          <select value={searchType} onChange={e => setSearchType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '12px', marginBottom: '8px', outline: 'none' }}>
            <option value="name" style={{ color: '#333' }}>👤 名前で検索</option>
            <option value="phone" style={{ color: '#333' }}>📞 電話番号で検索</option>
          </select>
          <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setActiveMenu('reservations'); }} placeholder="キーワードを入力..." style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
          {searchQuery && <div style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{filtered.length}件ヒット</div>}
        </div>

        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: '600', letterSpacing: '1px' }}>業種</div>
          <select value={businessType} onChange={async e => { setBusinessType(e.target.value); setSearchType('name'); const { data: { user } } = await supabase.auth.getUser(); if (user) await supabase.from('user_settings').upsert({ user_id: user.id, business_type: e.target.value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }); }} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '12px', outline: 'none' }}>
            {BUSINESS_TYPES.map(b => <option key={b.key} value={b.key} style={{ color: '#333' }}>{b.icon} {b.label}</option>)}
          </select>
        </div>

        <div style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', padding: '8px 16px', fontWeight: '600', letterSpacing: '1px' }}>MENU</div>
          {menuItems.map(item => (
            <div key={item.key} onClick={() => {
              if (item.key === 'customers') { router.push('/customers'); return; }
              if (item.key === 'register') { router.push('/customer-register'); return; }
              if (item.key === 'billing') { setShowUpgrade(true); return; }
              setActiveMenu(item.key); setSearchQuery('');
            }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', background: activeMenu === item.key ? 'rgba(255,255,255,0.15)' : 'transparent', borderLeft: activeMenu === item.key ? '3px solid #6366f1' : '3px solid transparent', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span style={{ fontSize: '13px', color: activeMenu === item.key ? 'white' : 'rgba(255,255,255,0.7)', fontWeight: activeMenu === item.key ? '600' : 'normal' }}>{item.label}</span>
              {item.key === 'reservations' && pendingCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 7px', fontSize: '10px', fontWeight: 'bold' }}>{pendingCount}</span>
              )}
            </div>
          ))}
        </div>

        <div onClick={() => router.push('/dashboard')} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
          <span>←</span><span>ダッシュボードに戻る</span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* トップバー */}
        <div style={{ background: 'white', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} data-no-print>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e' }}>
              {menuItems.find(m => m.key === activeMenu)?.icon} {menuItems.find(m => m.key === activeMenu)?.label}
            </div>
            {searchQuery && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>「{searchQuery}」の検索結果: {filtered.length}件</div>}
          </div>
          {(activeMenu === 'reservations' || searchQuery) && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {[{ key: 'all', label: `すべて (${reservations.length})` }, { key: 'pending', label: `未確認 (${reservations.filter(r => r.status === 'pending').length})` }, { key: 'confirmed', label: `確認済み (${reservations.filter(r => r.status === 'confirmed').length})` }].map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key as any)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', background: filter === key ? '#6366f1' : '#f3f4f6', color: filter === key ? 'white' : '#555', fontWeight: filter === key ? 'bold' : 'normal', cursor: 'pointer', fontSize: '12px' }}>{label}</button>
              ))}
            </div>
          )}
        </div>

        {/* コンテンツエリア */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }} data-print-area>

          {/* 予約一覧 */}
          {(activeMenu === 'reservations' || searchQuery) && (
            <>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                  <div style={{ color: '#999', fontSize: '14px' }}>{searchQuery ? '検索結果がありません' : '予約はありません'}</div>
                </div>
              ) : (
                filtered.map(res => (
                  <div key={res.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: res.status === 'pending' ? '2px solid #fbbf24' : '2px solid #e5e7eb' }}>
                    <div onClick={() => setExpandedId(expandedId === res.id ? null : res.id)} style={{ padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1a1a2e' }}>{res.customer_name}</div>
                        <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>{new Date(res.created_at).toLocaleString('ja-JP')}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: res.status === 'pending' ? '#fff3e0' : '#e8f5e9', color: res.status === 'pending' ? '#e65100' : '#2e7d32' }}>
                          {res.status === 'pending' ? '⏳ 未確認' : '✅ 確認済み'}
                        </div>
                        <span style={{ fontSize: '18px', color: '#999', transition: 'transform 0.2s', transform: expandedId === res.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                      </div>
                    </div>
                    {expandedId === res.id && (
                      <div style={{ padding: '0 26px 24px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '20px', marginBottom: '20px' }}>
                          {[
                            { label: '電話番号', value: `📞 ${res.phone}` },
                            ...(businessType === 'car' ? [{ label: '車種', value: `🚗 ${res.car_model || '—'}` }] : []),
                            { label: '作業内容', value: `🔧 ${res.work_type}` },
                            { label: '希望日時', value: `📅 ${res.preferred_date} ${res.preferred_time}` },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ background: '#f8f9fa', borderRadius: '12px', padding: '16px 18px' }}>
                              <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>{label}</div>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        {res.notes && <div style={{ background: '#f0f0ff', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '15px', color: '#555' }}>💬 {res.notes}</div>}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => addToSchedule(res)} style={{ flex: 2, padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: 'white', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>📅 タイムラインに追加</button>
                          <button onClick={() => { const params = new URLSearchParams({ name: res.customer_name || '', phone: res.phone || '', carModel: res.car_model || '', workType: res.work_type || '', workDate: res.preferred_date || '', notes: res.notes || '' }); router.push(`/customer-register?${params.toString()}`); }} style={{ flex: 2, padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>👤 顧客登録</button>
                          <button onClick={() => deleteReservation(res.id)} style={{ padding: '14px 22px', borderRadius: '10px', border: '2px solid #ff5252', background: 'white', color: '#ff5252', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>削除</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* 車検満了日 */}
          {activeMenu === 'inspection' && !searchQuery && (() => {
            const filteredInspection = inspectionCustomers.filter(c => {
              if (!c.inspection_date) return false;
              if (inspectionFrom && c.inspection_date < inspectionFrom) return false;
              if (inspectionTo && c.inspection_date > inspectionTo) return false;
              return true;
            });
            const countInRange = (min: number, max: number) => filteredInspection.filter(c => {
              const diff = Math.floor((new Date(c.inspection_date).getTime() - Date.now()) / 86400000);
              return diff >= min && diff <= max;
            }).length;
            return (
            <div>
              <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a1a2e', flexShrink: 0 }}>🔍 期間で絞り込み</div>
                <input type="date" value={inspectionFrom} onChange={e => setInspectionFrom(e.target.value)} style={{ padding: '8px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }} />
                <span style={{ fontSize: '13px', color: '#999' }}>〜</span>
                <input type="date" value={inspectionTo} onChange={e => setInspectionTo(e.target.value)} style={{ padding: '8px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }} />
                {(inspectionFrom || inspectionTo) && (
                  <button onClick={() => { setInspectionFrom(''); setInspectionTo(''); }} style={{ padding: '6px 14px', borderRadius: '8px', border: '2px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} data-no-print>× クリア</button>
                )}
                <button onClick={() => window.print()} style={{ padding: '6px 14px', borderRadius: '8px', border: '2px solid #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginLeft: (inspectionFrom || inspectionTo) ? '0' : 'auto' }} data-no-print>🖨 印刷</button>
                <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 'bold', marginLeft: (inspectionFrom || inspectionTo) ? 'auto' : '0' }}>{filteredInspection.length}件</div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[
                  { label: '期限切れ', count: filteredInspection.filter(c => Math.floor((new Date(c.inspection_date).getTime() - Date.now()) / 86400000) < 0).length, color: '#ef4444' },
                  { label: '30日以内', count: countInRange(0, 30), color: '#f59e0b' },
                  { label: '90日以内', count: countInRange(0, 90), color: '#10b981' },
                ].map(b => (
                  <div key={b.label} style={{ padding: '8px 20px', borderRadius: '20px', background: 'white', fontSize: '13px', fontWeight: 'bold', color: b.color, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    {b.label} ({b.count})
                  </div>
                ))}
              </div>

              {filteredInspection.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚗</div>
                  <div style={{ color: '#999', fontSize: '14px' }}>{(inspectionFrom || inspectionTo) ? 'この期間に該当する顧客はいません' : '車検満了日が登録された顧客はいません'}</div>
                </div>
              ) : (
                filteredInspection.map(c => {
                  const diff = Math.floor((new Date(c.inspection_date).getTime() - Date.now()) / 86400000);
                  const isBlack = c.custom_fields?.is_blacklist === true;
                  const statusColor = isBlack ? '#ef4444' : diff < 0 ? '#ef4444' : diff <= 30 ? '#f59e0b' : diff <= 90 ? '#10b981' : '#6366f1';
                  const statusBg = isBlack ? '#fef2f2' : diff < 0 ? '#fef2f2' : diff <= 30 ? '#fffbeb' : diff <= 90 ? '#f0fdf4' : '#f0f0ff';
                  const statusLabel = diff < 0 ? '期限切れ' : `あと${diff}日`;
                  return (
                    <div key={c.id} style={{ background: isBlack ? '#fef2f2' : 'white', borderRadius: '12px', padding: '20px 24px', marginBottom: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: `2px solid ${isBlack ? '#ef4444' : statusColor + '30'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
                      <div onClick={() => router.push(`/customers?highlight=${c.id}`)} style={{ width: '52px', height: '52px', borderRadius: '14px', background: isBlack ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #9ca3af, #6b7280)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px', flexShrink: 0 }}>{c.name?.charAt(0)}</div>
                      <div onClick={() => router.push(`/customers?highlight=${c.id}`)} style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: isBlack ? '#ef4444' : '#1a1a2e' }}>{c.name}</div>
                          {isBlack && <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>ブラックリスト</span>}
                        </div>
                        <div style={{ fontSize: '14px', color: '#555', marginTop: '4px' }}>📞 {c.phone || '電話番号未登録'}</div>
                        <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{c.car_model || '車種未登録'}{c.car_number ? ` ・ ${c.car_number}` : ''}</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px 20px', background: statusBg, borderRadius: '12px', border: `2px solid ${statusColor}30`, flexShrink: 0 }}>
                        <div style={{ fontSize: '12px', color: '#8b90a0', fontWeight: 'bold' }}>車検満了日</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: statusColor, letterSpacing: '1px' }}>{c.inspection_date}</div>
                      </div>
                      <div style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', background: statusBg, color: statusColor, flexShrink: 0 }}>{statusLabel}</div>
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        const newFields = { ...(c.custom_fields || {}), is_blacklist: !isBlack };
                        await supabase.from('customers').update({ custom_fields: newFields }).eq('id', c.id);
                        setInspectionCustomers(prev => prev.map(x => x.id === c.id ? { ...x, custom_fields: newFields } : x));
                      }} style={{ padding: '6px 12px', borderRadius: '8px', border: `2px solid ${isBlack ? '#10b981' : '#ef4444'}`, background: 'white', color: isBlack ? '#10b981' : '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flexShrink: 0, whiteSpace: 'nowrap' }} data-no-print>
                        {isBlack ? '✓ 解除' : '⚠ BL'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            );
          })()}

          {/* 次回アクション一覧 */}
          {activeMenu === 'actions' && !searchQuery && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {([
                  { key: 'pending', label: '未対応', color: '#f59e0b' },
                  { key: 'done', label: '完了済み', color: '#10b981' },
                  { key: 'all', label: 'すべて', color: '#6366f1' },
                ] as const).map(({ key, label, color }) => (
                  <button key={key} onClick={() => setActionFilter(key)} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', background: actionFilter === key ? color : 'white', color: actionFilter === key ? 'white' : '#555', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.2s' }}>{label}</button>
                ))}
                <button onClick={() => router.push('/customers')} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '20px', border: '2px solid #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>👤 顧客台帳で追加</button>
              </div>
              {actionsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>読み込み中...</div>
              ) : (
                <div>
                  {actions.filter(a => actionFilter === 'all' || a.status === actionFilter).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>{actionFilter === 'pending' ? '未対応のアクションはありません' : 'データがありません'}</div>
                      <div style={{ color: '#999', fontSize: '13px', marginBottom: '20px' }}>顧客台帳から次回アクションを設定できます</div>
                      <button onClick={() => router.push('/customers')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>👤 顧客台帳を開く</button>
                    </div>
                  ) : (
                    actions.filter(a => actionFilter === 'all' || a.status === actionFilter).map(action => {
                      const dateStyle = getDateStyle(action.scheduled_date);
                      const isExpanded = expandedActionId === action.id;
                      const custInfo = actionCustomerInfo[String(action.customer_id)];
                      return (
                        <div key={action.id} style={{ background: 'white', borderRadius: '16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: action.status === 'done' ? '2px solid #e5e7eb' : '2px solid #fbbf24', opacity: action.status === 'done' ? 0.65 : 1, overflow: 'hidden' }}>
                          <div onClick={() => setExpandedActionId(isExpanded ? null : action.id)} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e', whiteSpace: 'nowrap' }}>{action.customer_name}</span>
                              <span style={{ fontSize: '12px', background: '#f0f0ff', color: '#6366f1', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{action.action_type}</span>
                              {action.status === 'done' && <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>✅ 完了</span>}
                            </div>
                            <div style={{ fontSize: '13px', color: dateStyle.color, fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>📅 {dateStyle.label}</div>
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                              {action.status === 'pending' && <button onClick={(e) => { e.stopPropagation(); markActionDone(action.id); }} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>完了</button>}
                              <button onClick={(e) => { e.stopPropagation(); deleteAction(action.id); }} style={{ padding: '8px 14px', borderRadius: '8px', border: '2px solid #ff5252', background: 'white', color: '#ff5252', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>削除</button>
                            </div>
                            <span style={{ fontSize: '16px', color: '#999', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>▼</span>
                          </div>
                          {isExpanded && (
                            <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 20px 20px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>📞 電話番号</div><div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{custInfo?.phone || '未登録'}</div></div>
                                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>🚗 車種・ナンバー</div><div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{custInfo?.car_model || '未登録'}{custInfo?.car_number ? `（${custInfo.car_number}）` : ''}</div></div>
                                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>📍 住所</div><div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{custInfo?.address || '未登録'}</div></div>
                                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>🕒 設定日時</div><div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{new Date(action.created_at).toLocaleString('ja-JP')}</div></div>
                              </div>
                              {action.notes && <div style={{ background: '#f0f0ff', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '13px', color: '#555' }}>💬 {action.notes}</div>}
                              <button onClick={(e) => { e.stopPropagation(); router.push(`/customers?highlight=${action.customer_id}`); }} style={{ padding: '10px 18px', borderRadius: '8px', border: '2px solid #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>👤 顧客台帳で詳細を見る</button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* メッセージ */}
          {activeMenu === 'message' && !searchQuery && (
            <div>
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '4px' }}>💬 不具合・ご要望の送信</div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '20px' }}>送信内容はメールで通知されます</div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>種類</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ key: 'bug', label: '🐛 不具合報告' }, { key: 'feature', label: '🆕 機能の要望' }, { key: 'other', label: '💬 その他' }].map(t => (
                      <button key={t.key} onClick={() => setFeedbackType(t.key as any)} style={{ padding: '10px 16px', borderRadius: '8px', border: `2px solid ${feedbackType === t.key ? '#6366f1' : '#e5e7eb'}`, background: feedbackType === t.key ? '#f0f0ff' : 'white', color: feedbackType === t.key ? '#6366f1' : '#555', cursor: 'pointer', fontSize: '13px', fontWeight: feedbackType === t.key ? 'bold' : 'normal' }}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}><div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>タイトル</div><input value={feedbackTitle} onChange={e => setFeedbackTitle(e.target.value)} placeholder="例：タイムラインのスクロールが遅い" style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} /></div>
                <div style={{ marginBottom: '20px' }}><div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>詳細内容</div><textarea value={feedbackContent} onChange={e => setFeedbackContent(e.target.value)} placeholder="どの画面で、どんな操作をした時に起きたか、希望する内容などを書いてください" style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', minHeight: '120px', fontFamily: 'inherit' }} /></div>
                <button onClick={sendFeedback} disabled={feedbackSending} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: feedbackSending ? '#ccc' : '#6366f1', color: 'white', cursor: feedbackSending ? 'default' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}>{feedbackSending ? '送信中...' : '📨 送信する'}</button>
                {feedbackSent && <span style={{ marginLeft: '12px', color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>✓ 送信しました</span>}
              </div>
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px' }}>📋 送信履歴</div>
                {feedbackHistory.length === 0 ? (
                  <div style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '20px' }}>まだ送信履歴はありません</div>
                ) : (feedbackHistory.map(f => {
                  const typeLabel = { bug: '🐛 不具合報告', feature: '🆕 機能の要望', other: '💬 その他' }[f.type as 'bug' | 'feature' | 'other'] || f.type;
                  return (<div key={f.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', marginBottom: '10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}><span style={{ fontSize: '12px', background: '#f0f0ff', color: '#6366f1', padding: '2px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{typeLabel}</span><span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a2e' }}>{f.title}</span>{f.status === 'done' && <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 10px', borderRadius: '20px', fontWeight: 'bold' }}>✅ 対応済み</span>}</div><div style={{ fontSize: '13px', color: '#666', marginBottom: '4px', whiteSpace: 'pre-wrap' }}>{f.content}</div><div style={{ fontSize: '11px', color: '#999' }}>{new Date(f.created_at).toLocaleString('ja-JP')}</div></div>);
                }))}
              </div>
            </div>
          )}

          {/* 設定 */}
          {activeMenu === 'settings' && !searchQuery && (
            <div>
              <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '16px', overflow: 'hidden' }}>
                <div onClick={() => setOpenFieldSettings(!openFieldSettings)} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '4px' }}>⚙️ 項目モーダル設定</div><div style={{ fontSize: '13px', color: '#999' }}>作業項目ごとに、顧客台帳で記録する入力欄を設定できます。項目を押すと編集画面が開きます。</div></div>
                  <span style={{ fontSize: '18px', color: '#c0c4d0', transition: 'transform 0.2s', transform: openFieldSettings ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: '16px' }}>▼</span>
                </div>
                {openFieldSettings && (
                  <div style={{ padding: '0 24px 24px', borderTop: '1px solid #f0f0f0' }}>
                    {savedCategories.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>作業項目がありません。ダッシュボードの「項目追加」から登録してください。</div>
                    ) : (savedCategories.map(cat => (
                      <div key={cat.category} style={{ marginTop: '18px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: cat.borderColor || '#6366f1', marginBottom: '12px' }}>📋 {cat.category}</div>
                        {(cat.items || []).length === 0 ? (<div style={{ fontSize: '13px', color: '#bbb' }}>項目がありません</div>) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                            {(cat.items || []).map((item: any) => {
                              const fieldCount = (item.detailFields || []).length;
                              return (<div key={item.title} onClick={() => { setFieldEditItem({ category: cat.category, item }); setDraftFields(item.detailFields ? [...item.detailFields] : []); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '14px 16px', borderRadius: '12px', background: item.color || '#f8f9fa', border: `2px solid ${item.borderColor || '#e5e7eb'}`, cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}><div><div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a2e' }}>{item.title}</div><div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{fieldCount > 0 ? `記録欄 ${fieldCount}個` : '未設定'}</div></div><span style={{ fontSize: '16px', color: item.borderColor || '#999' }}>▶</span></div>);
                            })}
                          </div>
                        )}
                      </div>
                    )))}
                  </div>
                )}
              </div>

              <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '16px', overflow: 'hidden' }}>
                <div onClick={() => setOpenActionSettings(!openActionSettings)} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '4px' }}>🔔 次回アクション設定</div><div style={{ fontSize: '13px', color: '#999' }}>カテゴリーごとに、次回アクションの選択肢を設定できます。</div></div>
                  <span style={{ fontSize: '18px', color: '#c0c4d0', transition: 'transform 0.2s', transform: openActionSettings ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: '16px' }}>▼</span>
                </div>
                {openActionSettings && (
                  <div style={{ padding: '0 24px 24px', borderTop: '1px solid #f0f0f0' }}>
                    {savedCategories.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>カテゴリーがありません。ダッシュボードの「項目追加」から登録してください。</div>
                    ) : (savedCategories.map(cat => {
                      const catActions = cat.actionTypes || [];
                      return (
                        <div key={cat.category} style={{ marginTop: '18px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: cat.borderColor || '#f59e0b', marginBottom: '12px' }}>🔔 {cat.category}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                            {catActions.map((action: string, aIdx: number) => (
                              <div key={aIdx} onClick={() => { setActionEditCat(cat.category); setDraftActionTypes([...catActions]); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '14px 16px', borderRadius: '12px', background: '#fff3e0', border: '2px solid #f59e0b', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}><div><div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a2e' }}>{action}</div></div><span style={{ fontSize: '16px', color: '#f59e0b' }}>▶</span></div>
                            ))}
                            <div onClick={() => { setActionEditCat(cat.category); setDraftActionTypes([...catActions]); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 16px', borderRadius: '12px', background: 'white', border: '2px dashed #f59e0b', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#d97706', transition: 'transform 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.background = '#fff3e0'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.background = 'white'; }}>＋ 追加</div>
                          </div>
                        </div>
                      );
                    }))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 準備中 */}
          {!searchQuery && !['reservations', 'stats', 'actions', 'message', 'billing', 'settings', 'inspection'].includes(activeMenu) && (
            <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{menuItems.find(m => m.key === activeMenu)?.icon}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>{menuItems.find(m => m.key === activeMenu)?.label}</div>
              <div style={{ color: '#999', fontSize: '14px' }}>この機能は近日公開予定です</div>
            </div>
          )}
        </div>
      </div>

      {/* アクション種別 編集モーダル */}
      {actionEditCat && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setActionEditCat(null)}>
          <div style={{ width: '480px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>🔔 {actionEditCat} のアクション</span><span onClick={() => setActionEditCat(null)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span></div>
            <div style={{ fontSize: '13px', color: '#8b90a0', marginBottom: '20px' }}>このカテゴリーで使える次回アクションの選択肢を設定できます</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {draftActionTypes.length === 0 && (<div style={{ fontSize: '13px', color: '#bbb', textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>まだアクションがありません。下のボタンで追加してください。</div>)}
              {draftActionTypes.map((t, idx) => (<div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ fontSize: '13px', color: '#999', width: '20px', textAlign: 'center' }}>{idx + 1}</span><input value={t} onChange={e => { const nt = [...draftActionTypes]; nt[idx] = e.target.value; setDraftActionTypes(nt); }} placeholder="アクション名（例: 車検案内）" style={{ flex: 1, padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} /><button onClick={() => setDraftActionTypes(draftActionTypes.filter((_, i) => i !== idx))} style={{ padding: '11px 14px', borderRadius: '10px', border: '2px solid #ff5252', background: 'white', color: '#ff5252', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>×</button></div>))}
            </div>
            <button onClick={() => setDraftActionTypes([...draftActionTypes, ''])} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px dashed #f59e0b', background: 'white', color: '#d97706', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>＋ アクションを追加</button>
            <button onClick={async () => { const cleaned = draftActionTypes.filter(t => t.trim() !== ''); await saveActionTypesForCat(actionEditCat, cleaned); setActionEditCat(null); }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>完了</button>
          </div>
        </div>
      )}

      {/* 項目フィールド編集モーダル */}
      {fieldEditItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFieldEditItem(null)}>
          <div style={{ width: '480px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>⚙️ {fieldEditItem.item.title} の記録欄</span><span onClick={() => setFieldEditItem(null)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span></div>
            <div style={{ fontSize: '13px', color: '#8b90a0', marginBottom: '20px' }}>この項目を顧客台帳で開いたとき、ここで作った欄に記録できます</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {draftFields.length === 0 && (<div style={{ fontSize: '13px', color: '#bbb', textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>まだ記録欄がありません。下のボタンで追加してください。</div>)}
              {draftFields.map((f, fIdx) => (<div key={fIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ fontSize: '13px', color: '#999', width: '20px', textAlign: 'center' }}>{fIdx + 1}</span><input value={f.label} onChange={e => { const nf = [...draftFields]; nf[fIdx] = { label: e.target.value }; setDraftFields(nf); }} placeholder="項目名（例: 販売金額・商品名）" style={{ flex: 1, padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} /><button onClick={() => setDraftFields(draftFields.filter((_, i) => i !== fIdx))} style={{ padding: '11px 14px', borderRadius: '10px', border: '2px solid #ff5252', background: 'white', color: '#ff5252', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>×</button></div>))}
            </div>
            <button onClick={() => setDraftFields([...draftFields, { label: '' }])} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px dashed #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>＋ 記録欄を追加</button>
            <button onClick={async () => { const cleaned = draftFields.filter(f => f.label.trim() !== ''); await saveDetailFields(fieldEditItem.category, fieldEditItem.item.title, cleaned); setFieldEditItem(null); }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>完了</button>
          </div>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} userId={userId} />
    </div>
  );
}
