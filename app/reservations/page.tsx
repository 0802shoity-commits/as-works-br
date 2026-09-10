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

  // 予約ページ設定
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopBgColor, setShopBgColor] = useState('#1a1a2e');
  const [shopImageUrl, setShopImageUrl] = useState('');
  const [openBookingSettings, setOpenBookingSettings] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [shopSaving, setShopSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [shopNameSize, setShopNameSize] = useState(28);
  const [shopDescSize, setShopDescSize] = useState(14);
  const [shopImageSize, setShopImageSize] = useState(140);
  const [shopImageX, setShopImageX] = useState(50);

  // 請求管理
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPlan, setBillingPlan] = useState('free');
  const [billingCreatedAt, setBillingCreatedAt] = useState('');

  // シフト管理
  const [shiftYear, setShiftYear] = useState(new Date().getFullYear());
  const [shiftMonth, setShiftMonth] = useState(new Date().getMonth());
  const [shiftStaff, setShiftStaff] = useState<string[]>([]);
  const [shiftData, setShiftData] = useState<{ [key: string]: any }>({});
  const [shiftModal, setShiftModal] = useState<{ staff: string; date: string } | null>(null);
  const [shiftForm, setShiftForm] = useState({ startTime: '09:00', endTime: '18:00', isOff: false, shiftType: '' });
  const [shiftLoading, setShiftLoading] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [shiftPatterns, setShiftPatterns] = useState<{ code: string; label: string; start: string; end: string }[]>([]);
  const [shiftAppointments, setShiftAppointments] = useState<{ [date: string]: number }>({});
  const [editingPatterns, setEditingPatterns] = useState(false);
  const [draftPatterns, setDraftPatterns] = useState<{ code: string; label: string; start: string; end: string }[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<{ [date: string]: string }>({});
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState('');
  const [staffSkills, setStaffSkills] = useState<{ [name: string]: string }>({});
  const [editingSkills, setEditingSkills] = useState<string | null>(null);
  const [skillsDraft, setSkillsDraft] = useState('');
  const [syncSchedule, setSyncSchedule] = useState(true);
  const [dashboardStaff, setDashboardStaff] = useState<string[]>([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [shiftScheduleSync, setShiftScheduleSync] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      const { data: planData } = await supabase.from('user_plans').select('plan').eq('user_id', user.id).single();
      if (planData?.plan !== 'premium') { router.push('/dashboard'); return; }
      setBillingPlan(planData?.plan || 'free');
      setBillingEmail(user.email || '');
      setBillingCreatedAt(user.created_at || '');
      const { data } = await supabase.from('customer_reservations').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
      if (data) setReservations(data);
      const { data: settingsData } = await supabase.from('user_settings').select('business_type, shop_name, shop_description, shop_bg_color, shop_image_url, shop_name_size, shop_desc_size, shop_image_size, shop_image_x').eq('user_id', user.id).single();
      if (settingsData?.business_type) setBusinessType(settingsData.business_type);
      if (settingsData?.shop_name) setShopName(settingsData.shop_name);
      if (settingsData?.shop_description) setShopDescription(settingsData.shop_description);
      if (settingsData?.shop_bg_color) setShopBgColor(settingsData.shop_bg_color);
      if (settingsData?.shop_image_url) setShopImageUrl(settingsData.shop_image_url);
      if (settingsData?.shop_name_size) setShopNameSize(settingsData.shop_name_size);
      if (settingsData?.shop_desc_size) setShopDescSize(settingsData.shop_desc_size);
      if (settingsData?.shop_image_size) setShopImageSize(settingsData.shop_image_size);
      if (settingsData?.shop_image_x != null) setShopImageX(settingsData.shop_image_x);
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

  // シフトデータ取得
  useEffect(() => {
    if (activeMenu !== 'shifts') return;
    const fetchShifts = async () => {
      setShiftLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setShiftLoading(false); return; }

      const { data: staffData } = await supabase.from('staff_members').select('name, skills').eq('user_id', user.id);
      if (staffData) {
        setShiftStaff(staffData.map((s: any) => s.name));
        const skillMap: { [name: string]: string } = {};
        staffData.forEach((s: any) => { if (s.skills) skillMap[s.name] = s.skills; });
        setStaffSkills(skillMap);
      }

      const { data: settingsData } = await supabase.from('user_settings').select('shift_patterns').eq('user_id', user.id).maybeSingle();
      if (settingsData?.shift_patterns && Array.isArray(settingsData.shift_patterns) && settingsData.shift_patterns.length > 0) {
        setShiftPatterns(settingsData.shift_patterns);
      } else {
        setShiftPatterns([
          { code: 'A', label: '早番', start: '08:00', end: '16:00' },
          { code: 'B', label: '日勤', start: '09:00', end: '18:00' },
          { code: 'C', label: '遅番', start: '12:00', end: '21:00' },
          { code: 'D', label: '通し', start: '08:00', end: '21:00' },
        ]);
      }

      const startDate = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-01`;
      const endDay = new Date(shiftYear, shiftMonth + 1, 0).getDate();
      const endDate = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-${endDay}`;

      const { data: shifts } = await supabase
        .from('staff_shifts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (shifts) {
        const map: { [key: string]: any } = {};
        shifts.forEach((s: any) => { map[`${s.staff_name}_${s.date}`] = s; });
        setShiftData(map);
      }

      const { data: appData } = await supabase
        .from('appointments')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (appData) {
        const countMap: { [date: string]: number } = {};
        appData.forEach((a: any) => { countMap[a.date] = (countMap[a.date] || 0) + 1; });
        setShiftAppointments(countMap);
      }

      const { data: eventsData } = await supabase
        .from('calendar_events')
        .select('date, title')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (eventsData) {
        const evtMap: { [date: string]: string } = {};
        eventsData.forEach((e: any) => { evtMap[e.date] = e.title; });
        setCalendarEvents(evtMap);
      }

      // ダッシュボードの出勤設定からスタッフ名を取得
      const { data: attendanceStaff } = await supabase
        .from('staff_attendance')
        .select('staff_name')
        .eq('user_id', user.id);
      if (attendanceStaff) {
        const uniqueNames = [...new Set(attendanceStaff.map((s: any) => s.staff_name))].filter(Boolean) as string[];
        setDashboardStaff(uniqueNames);
      }

      setShiftLoading(false);
    };
    fetchShifts();
  }, [activeMenu, shiftYear, shiftMonth]);

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
    { key: 'shifts', icon: '📅', label: 'シフト管理' },
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
              setActiveMenu(item.key); setSearchQuery('');
            }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', background: activeMenu === item.key ? 'rgba(255,255,255,0.15)' : 'transparent', borderLeft: activeMenu === item.key ? '3px solid #6366f1' : '3px solid transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (activeMenu !== item.key) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (activeMenu !== item.key) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span style={{ fontSize: '13px', color: activeMenu === item.key ? 'white' : 'rgba(255,255,255,0.7)', fontWeight: activeMenu === item.key ? '600' : 'normal' }}>{item.label}</span>
              {item.key === 'reservations' && pendingCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 7px', fontSize: '10px', fontWeight: 'bold' }}>{pendingCount}</span>
              )}
            </div>
          ))}
        </div>

        <div onClick={() => router.push('/dashboard')} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '13px', transition: 'all 0.2s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}>
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

          {/* シフト管理 */}
          {activeMenu === 'shifts' && !searchQuery && (() => {
            const daysInMonth = new Date(shiftYear, shiftMonth + 1, 0).getDate();
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

            const saveShift = async (staff: string, date: string, data: any) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              const key = `${staff}_${date}`;
              if (data.isOff) {
                await supabase.from('staff_shifts').upsert({
                  user_id: user.id, staff_name: staff, date, start_time: null, end_time: null, is_off: true, shift_type: '休',
                }, { onConflict: 'user_id,staff_name,date' });
                setShiftData(prev => ({ ...prev, [key]: { ...prev[key], staff_name: staff, date, start_time: null, end_time: null, is_off: true, shift_type: '休' } }));
              } else if (data.startTime && data.endTime) {
                await supabase.from('staff_shifts').upsert({
                  user_id: user.id, staff_name: staff, date, start_time: data.startTime, end_time: data.endTime, is_off: false, shift_type: data.shiftType || '',
                }, { onConflict: 'user_id,staff_name,date' });
                setShiftData(prev => ({ ...prev, [key]: { staff_name: staff, date, start_time: data.startTime, end_time: data.endTime, is_off: false, shift_type: data.shiftType || '' } }));
                await supabase.from('staff_attendance').upsert({
                  user_id: user.id, staff_name: staff, date,
                }, { onConflict: 'user_id,staff_name,date' });
              }
            };

            const deleteShift = async (staff: string, date: string) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from('staff_shifts').delete().eq('user_id', user.id).eq('staff_name', staff).eq('date', date);
              setShiftData(prev => { const n = { ...prev }; delete n[`${staff}_${date}`]; return n; });
            };

            const addStaff = async () => {
              if (!newStaffName.trim()) return;
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from('staff_members').upsert({ user_id: user.id, name: newStaffName.trim() }, { onConflict: 'user_id,name' });
              setShiftStaff(prev => [...prev, newStaffName.trim()]);
              setNewStaffName('');
            };

            const saveShiftQuick = async (staff: string, date: string, pattern: { code: string; label: string; start: string; end: string }) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              const key = `${staff}_${date}`;
              await supabase.from('staff_shifts').upsert({
                user_id: user.id, staff_name: staff, date,
                start_time: pattern.start, end_time: pattern.end,
                is_off: false, shift_type: pattern.label,
              }, { onConflict: 'user_id,staff_name,date' });
              setShiftData(prev => ({ ...prev, [key]: {
                staff_name: staff, date,
                start_time: pattern.start, end_time: pattern.end,
                is_off: false, shift_type: pattern.label,
              }}));
            };

            const markOffQuick = async (staff: string, date: string) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              const key = `${staff}_${date}`;
              await supabase.from('staff_shifts').upsert({
                user_id: user.id, staff_name: staff, date,
                start_time: null, end_time: null, is_off: true, shift_type: '休',
              }, { onConflict: 'user_id,staff_name,date' });
              setShiftData(prev => ({ ...prev, [key]: { staff_name: staff, date, is_off: true, shift_type: '休' } }));
            };

            const deleteShiftQuick = async (staff: string, date: string) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from('staff_shifts').delete().eq('user_id', user.id).eq('staff_name', staff).eq('date', date);
              setShiftData(prev => { const n = { ...prev }; delete n[`${staff}_${date}`]; return n; });
            };

            return (
            <div>
              {/* 月ナビゲーション */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => { if (shiftMonth === 0) { setShiftMonth(11); setShiftYear(y => y - 1); } else setShiftMonth(m => m - 1); }} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', fontSize: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>◀</button>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>{shiftYear}年 {shiftMonth + 1}月</div>
                  <button onClick={() => { if (shiftMonth === 11) { setShiftMonth(0); setShiftYear(y => y + 1); } else setShiftMonth(m => m + 1); }} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', fontSize: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>▶</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => { setEditingPatterns(true); setDraftPatterns([...shiftPatterns]); }} style={{ padding: '8px 14px', borderRadius: '8px', border: '2px solid #f59e0b', background: 'white', color: '#f59e0b', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>⚙ パターン設定</button>

                  {/* スケジュール連携トグル */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', border: `2px solid ${shiftScheduleSync ? '#10b981' : '#e5e7eb'}`, background: shiftScheduleSync ? '#f0fdf4' : 'white' }}>
                    <span style={{ fontSize: '11px', color: shiftScheduleSync ? '#10b981' : '#888', fontWeight: 'bold', whiteSpace: 'nowrap' }}>📋 スケジュール連携</span>
                    <div onClick={async () => {
                      const next = !shiftScheduleSync;
                      setShiftScheduleSync(next);
                      if (next) {
                        // シフトデータを出勤設定に一括反映
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;
                        const startDate = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-01`;
                        const endDay = new Date(shiftYear, shiftMonth + 1, 0).getDate();
                        const endDate = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-${endDay}`;

                        // この月の出勤データを全削除
                        await supabase.from('staff_attendance')
                          .delete()
                          .eq('user_id', user.id)
                          .gte('date', startDate)
                          .lte('date', endDate);

                        // シフトがある日だけ挿入
                        const inserts: any[] = [];
                        shiftStaff.forEach(staff => {
                          for (let d = 1; d <= endDay; d++) {
                            const dateStr = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const s = shiftData[`${staff}_${dateStr}`];
                            if (s && !s.is_off && s.start_time) {
                              inserts.push({ user_id: user.id, staff_name: staff, date: dateStr });
                            }
                          }
                        });
                        if (inserts.length > 0) {
                          await supabase.from('staff_attendance').insert(inserts);
                        }
                        alert(`${shiftYear}年${shiftMonth + 1}月のシフトをスケジュールに反映しました（${inserts.length}件）`);
                      }
                    }} style={{ width: '36px', height: '20px', borderRadius: '10px', background: shiftScheduleSync ? '#10b981' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: shiftScheduleSync ? '18px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </label>

                  {/* スタッフ追加（ドロップダウン付き） */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStaff()} placeholder="スタッフ名" style={{ padding: '8px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', width: '140px', outline: 'none' }} />
                      <button onClick={() => setShowStaffDropdown(!showStaffDropdown)} style={{ padding: '8px 10px', borderRadius: '8px', border: '2px solid #e5e7eb', background: showStaffDropdown ? '#eef2ff' : 'white', cursor: 'pointer', fontSize: '12px' }} title="出勤設定から選択">▼</button>
                      <button onClick={addStaff} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>＋ 追加</button>
                    </div>
                    {showStaffDropdown && (() => {
                      const availableStaff = dashboardStaff.filter(name => !shiftStaff.includes(name));
                      return (
                        <div style={{ position: 'absolute', top: '42px', right: 0, background: 'white', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '2px solid #e5e7eb', zIndex: 10, minWidth: '200px', maxHeight: '240px', overflowY: 'auto' }}>
                          <div style={{ padding: '8px 12px', fontSize: '11px', color: '#888', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0' }}>📋 出勤設定のスタッフ</div>
                          {availableStaff.length === 0 ? (
                            <div style={{ padding: '16px 12px', fontSize: '12px', color: '#bbb', textAlign: 'center' }}>{dashboardStaff.length === 0 ? '出勤データがありません' : '全員追加済みです'}</div>
                          ) : (
                            availableStaff.map(name => (
                              <div key={name} onClick={async () => {
                                const { data: { user } } = await supabase.auth.getUser();
                                if (!user) return;
                                await supabase.from('staff_members').upsert({ user_id: user.id, name }, { onConflict: 'user_id,name' });
                                setShiftStaff(prev => [...prev, name]);
                                setShowStaffDropdown(false);
                              }} style={{ padding: '10px 14px', fontSize: '13px', color: '#333', cursor: 'pointer', borderBottom: '1px solid #f8f8f8', display: 'flex', alignItems: 'center', gap: '8px' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#eef2ff'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}>
                                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>{name.charAt(0)}</span>
                                {name}
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* パターン凡例 */}
              {shiftPatterns.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {shiftPatterns.map(p => (
                    <div key={p.code} style={{ padding: '4px 10px', borderRadius: '6px', background: '#f0f0ff', fontSize: '11px', color: '#6366f1', fontWeight: 'bold' }}>
                      {p.code} = {p.label}（{p.start}〜{p.end}）
                    </div>
                  ))}
                </div>
              )}

              {shiftLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>読み込み中...</div>
              ) : shiftStaff.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>スタッフが登録されていません</div>
                  <div style={{ color: '#999', fontSize: '13px' }}>上の入力欄からスタッフを追加してください</div>
                </div>
              ) : (
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '110px' }} />
                      {days.map(d => <col key={d} style={{ width: `${Math.max(100 / (daysInMonth + 3), 2.5)}%` }} />)}
                      <col style={{ width: '56px' }} />
                    </colgroup>
                    <thead>
                      {/* イベント行 */}
                      <tr>
                        <th style={{ padding: '4px 8px', background: '#fffbeb', fontSize: '11px', fontWeight: 'bold', color: '#92400e', textAlign: 'left', position: 'sticky', left: 0, zIndex: 3, borderBottom: '1px solid #fde68a', height: '80px', verticalAlign: 'bottom' }}>📌 イベント</th>
                        {days.map(d => {
                          const dateStr = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const evt = calendarEvents[dateStr];
                          return (
                            <th key={d} onClick={() => { setEditingEvent(dateStr); setEventDraft(evt || ''); }} style={{ padding: '2px', background: evt ? '#fffbeb' : '#fafafa', textAlign: 'center', fontSize: '9px', color: '#92400e', borderBottom: '1px solid #fde68a', cursor: 'pointer', verticalAlign: 'middle', overflow: 'hidden', height: '80px' }} title={evt || 'クリックで追加'}>
                              {editingEvent === dateStr ? (
                                <textarea autoFocus value={eventDraft} onChange={e => setEventDraft(e.target.value)} onBlur={async () => {
                                  const { data: { user } } = await supabase.auth.getUser();
                                  if (!user) { setEditingEvent(null); return; }
                                  if (eventDraft.trim()) {
                                    await supabase.from('calendar_events').upsert({ user_id: user.id, date: dateStr, title: eventDraft.trim() }, { onConflict: 'user_id,date' });
                                    setCalendarEvents(prev => ({ ...prev, [dateStr]: eventDraft.trim() }));
                                  } else {
                                    await supabase.from('calendar_events').delete().eq('user_id', user.id).eq('date', dateStr);
                                    setCalendarEvents(prev => { const n = { ...prev }; delete n[dateStr]; return n; });
                                  }
                                  setEditingEvent(null);
                                }} style={{ width: '100%', height: '72px', padding: '2px', border: '1px solid #f59e0b', borderRadius: '3px', fontSize: '10px', textAlign: 'center', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
                              ) : (
                                <span data-evt-text style={{ fontSize: '10px', lineHeight: '1.3', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '72px', overflow: 'hidden', whiteSpace: 'pre-line', textAlign: 'center', wordBreak: 'keep-all' }}>{evt || ''}</span>
                              )}
                            </th>
                          );
                        })}
                        <th style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', height: '80px' }}></th>
                      </tr>
                      {/* 日付ヘッダー */}
                      <tr>
                        <th style={{ padding: '6px 8px', background: '#1a1a2e', color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'left', position: 'sticky', left: 0, zIndex: 3 }}>スタッフ</th>
                        {days.map(d => {
                          const dow = new Date(shiftYear, shiftMonth, d).getDay();
                          const dateStr = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const evtCount = shiftAppointments[dateStr] || 0;
                          const isToday = new Date().getFullYear() === shiftYear && new Date().getMonth() === shiftMonth && new Date().getDate() === d;
                          return (
                            <th key={d} style={{ padding: '3px 1px', background: isToday ? '#eef2ff' : (dow === 0 ? '#fef2f2' : dow === 6 ? '#eff6ff' : '#f8f9fa'), textAlign: 'center', fontSize: '10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #eef0f5' }}>
                              <div style={{ fontWeight: 'bold', color: dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : '#333', fontSize: isToday ? '12px' : '10px' }}>{d}</div>
                              <div style={{ color: dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : '#999', fontSize: '9px' }}>{dayNames[dow]}</div>
                              {evtCount > 0 && <div style={{ fontSize: '8px', background: '#6366f1', color: 'white', borderRadius: '6px', padding: '0px 3px', display: 'inline-block', marginTop: '1px' }}>{evtCount}</div>}
                            </th>
                          );
                        })}
                        <th style={{ padding: '3px 4px', background: '#1a1a2e', color: 'white', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>合計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftStaff.map((staff, sIdx) => (
                        <tr key={staff} style={{ background: sIdx % 2 === 0 ? 'white' : '#fafbfc' }}>
                          <td style={{ padding: '6px 8px', fontSize: '12px', color: '#1a1a2e', borderBottom: '1px solid #f0f0f0', position: 'sticky', left: 0, background: sIdx % 2 === 0 ? 'white' : '#fafbfc', zIndex: 1, borderRight: '2px solid #e5e7eb' }}>
                            <div style={{ fontWeight: 'bold' }}>{staff}</div>
                            <div style={{ marginTop: '2px' }}>
                              {[0, 1, 2].map(lineIdx => {
                                const lines = (staffSkills[staff] || '').split('\n');
                                const val = lines[lineIdx] || '';
                                return (
                                  <input key={lineIdx} value={val} onChange={e => {
                                    const newLines = (staffSkills[staff] || '').split('\n');
                                    while (newLines.length < 3) newLines.push('');
                                    newLines[lineIdx] = e.target.value;
                                    setStaffSkills(prev => ({ ...prev, [staff]: newLines.join('\n') }));
                                  }} onBlur={async () => {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (user) await supabase.from('staff_members').update({ skills: staffSkills[staff] || '' }).eq('user_id', user.id).eq('name', staff);
                                  }} placeholder={`スキル${lineIdx + 1}`} onClick={e => e.stopPropagation()} style={{ display: 'block', width: '90px', padding: '1px 3px', border: '1px solid #eee', borderRadius: '2px', fontSize: '8px', outline: 'none', color: '#666', marginBottom: '1px', background: val ? '#f8f9fa' : 'transparent', boxSizing: 'border-box' }} />
                                );
                              })}
                            </div>
                          </td>
                          {days.map(d => {
                            const dateStr = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const key = `${staff}_${dateStr}`;
                            const shift = shiftData[key];
                            const dow = new Date(shiftYear, shiftMonth, d).getDay();
                            const hasShift = shift && !shift.is_off && shift.start_time;
                            const isOff = shift?.is_off;
                            return (
                              <td key={d} tabIndex={0}
                              onKeyDown={async (e) => {
                                const matched = shiftPatterns.find(p => p.code.toUpperCase() === e.key.toUpperCase());
                                if (matched) {
                                  e.preventDefault();
                                  await saveShiftQuick(staff, dateStr, matched);
                                  // 右のセルにフォーカス移動
                                  const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                                  if (next) next.focus();
                                } else if (e.key === 'Delete' || e.key === 'Backspace') {
                                  e.preventDefault();
                                  await deleteShiftQuick(staff, dateStr);
                                } else if (e.key === 'x' || e.key === 'X') {
                                  e.preventDefault();
                                  await markOffQuick(staff, dateStr);
                                  const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                                  if (next) next.focus();
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  setShiftModal({ staff, date: dateStr });
                                  setSyncSchedule(shift?.shift_type?.includes('[出勤]') || false);
                                  setShiftForm(shift ? {
                                    startTime: shift.start_time || '09:00',
                                    endTime: shift.end_time || '18:00',
                                    isOff: shift.is_off || false,
                                    shiftType: shift.shift_type || '',
                                  } : { startTime: '09:00', endTime: '18:00', isOff: false, shiftType: '' });
                                } else if (e.key === 'ArrowRight') {
                                  const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                                  if (next) next.focus();
                                } else if (e.key === 'ArrowLeft') {
                                  const prev = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement;
                                  if (prev) prev.focus();
                                }
                              }}
                              onClick={(e) => {
                                (e.currentTarget as HTMLElement).focus();
                              }}
                              onDoubleClick={() => {
                                setShiftModal({ staff, date: dateStr });
                                setSyncSchedule(shift?.shift_type?.includes('[出勤]') || false);
                                setShiftForm(shift ? {
                                  startTime: shift.start_time || '09:00',
                                  endTime: shift.end_time || '18:00',
                                  isOff: shift.is_off || false,
                                  shiftType: shift.shift_type || '',
                                } : { startTime: '09:00', endTime: '18:00', isOff: false, shiftType: '' });
                              }}
                              style={{
                                padding: '2px 1px', textAlign: 'center', borderBottom: '1px solid #f0f0f0',
                                cursor: 'pointer', transition: 'background 0.15s', verticalAlign: 'middle',
                                background: isOff ? '#f3f4f6' : hasShift ? '#eef2ff' : (dow === 0 ? '#fef2f230' : dow === 6 ? '#eff6ff30' : 'transparent'),
                                height: '38px', borderRight: '1px solid #eef0f5', outline: 'none',
                              }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#e0e7ff'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isOff ? '#f3f4f6' : hasShift ? '#eef2ff' : 'transparent'}
                              onFocus={e => (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 0 0 2px #6366f1'}
                              onBlur={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                                {isOff ? (
                                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af' }}>休</div>
                                ) : hasShift ? (() => {
                                  const matchedPattern = shiftPatterns.find(p => p.start === shift.start_time && p.end === shift.end_time);
                                  const isSynced = shift.shift_type?.includes('[出勤]');
                                  return (
                                    <div>
                                      {matchedPattern ? (
                                        <>
                                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6366f1' }}>{matchedPattern.code}</div>
                                          <div style={{ fontSize: '8px', color: '#888', lineHeight: '1.2', marginTop: '1px' }}>{matchedPattern.start}〜{matchedPattern.end}</div>
                                        </>
                                      ) : (
                                        <div style={{ fontSize: '9px', fontWeight: '600', color: '#1a1a2e', lineHeight: '1.2' }}>{shift.start_time}<br/>〜<br/>{shift.end_time}</div>
                                      )}
                                      {isSynced && <div style={{ fontSize: '7px', color: '#10b981', marginTop: '1px' }}>●出勤</div>}
                                    </div>
                                  );
                                })() : (
                                  <div style={{ fontSize: '16px', color: '#e5e7eb' }}>·</div>
                                )}
                              </td>
                            );
                          })}
                          {/* 合計勤務時間 */}
                          {(() => {
                            let totalMinutes = 0;
                            days.forEach(d => {
                              const dateStr = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                              const s = shiftData[`${staff}_${dateStr}`];
                              if (s && !s.is_off && s.start_time && s.end_time) {
                                const [sh, sm] = s.start_time.split(':').map(Number);
                                const [eh, em] = s.end_time.split(':').map(Number);
                                totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
                              }
                            });
                            const h = Math.floor(totalMinutes / 60);
                            const m = totalMinutes % 60;
                            return (
                              <td style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', background: sIdx % 2 === 0 ? '#f0f0ff' : '#eae8ff', borderLeft: '2px solid #e5e7eb', fontWeight: 'bold' }}>
                                <div style={{ fontSize: '13px', color: '#6366f1' }}>{h}h</div>
                                {m > 0 && <div style={{ fontSize: '9px', color: '#888' }}>{m}m</div>}
                              </td>
                            );
                          })()}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 凡例 */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '11px', color: '#888', alignItems: 'center', flexWrap: 'wrap' }}>
                <span>🟦 勤務あり</span><span>⬜ 未設定</span><span>休 休み</span>
                <span style={{ color: '#6366f1', fontWeight: 'bold' }}>⌨ セルをクリック→キーで入力：{shiftPatterns.map(p => p.code).join('/')}=シフト  X=休み  Del=削除  Enter=詳細</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px' }}>イベント文字:</span>
                  <input type="range" min="8" max="16" defaultValue="10" onChange={e => {
                    document.querySelectorAll('[data-evt-text]').forEach(el => (el as HTMLElement).style.fontSize = e.target.value + 'px');
                  }} style={{ width: '80px' }} />
                </span>
              </div>
            </div>
            );
          })()}

          {/* シフト入力モーダル */}
          {shiftModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShiftModal(null)}>
              <div style={{ width: '400px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📅 シフト設定</span>
                  <span onClick={() => setShiftModal(null)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span>
                </div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
                  {shiftModal.staff} ・ {shiftModal.date}
                </div>

                {/* 休みトグル */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <div onClick={() => setShiftForm({ ...shiftForm, isOff: !shiftForm.isOff })} style={{ width: '44px', height: '24px', borderRadius: '12px', background: shiftForm.isOff ? '#ef4444' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: shiftForm.isOff ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: shiftForm.isOff ? '#ef4444' : '#333' }}>{shiftForm.isOff ? '休み' : '勤務'}</span>
                  </label>
                </div>

                {!shiftForm.isOff && (
                  <>
                    {/* シフトタイプ */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>シフト種別（任意）</div>
                      <input value={shiftForm.shiftType} onChange={e => setShiftForm({ ...shiftForm, shiftType: e.target.value })} placeholder="例: 早番, 遅番, 通し" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                    </div>

                    {/* 時間 */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>開始時間</div>
                        <input type="time" value={shiftForm.startTime} onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>終了時間</div>
                        <input type="time" value={shiftForm.endTime} onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                    </div>
                  </>
                )}

                {/* パターンで入力 + 出勤反映 */}
                {!shiftForm.isOff && shiftPatterns.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>パターンで入力</div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <span style={{ fontSize: '11px', color: syncSchedule ? '#10b981' : '#999', fontWeight: 'bold' }}>📋 出勤反映</span>
                        <div onClick={() => setSyncSchedule(!syncSchedule)} style={{ width: '36px', height: '20px', borderRadius: '10px', background: syncSchedule ? '#10b981' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: syncSchedule ? '18px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                      {shiftPatterns.map(p => {
                        const isActive = shiftForm.startTime === p.start && shiftForm.endTime === p.end;
                        return (
                          <button key={p.code} onClick={() => setShiftForm({ ...shiftForm, startTime: p.start, endTime: p.end, shiftType: p.label })} style={{ padding: '8px 6px', borderRadius: '8px', border: `2px solid ${isActive ? '#6366f1' : '#e5e7eb'}`, background: isActive ? '#eef2ff' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: isActive ? '#6366f1' : '#333' }}>{p.code}</div>
                            <div style={{ fontSize: '10px', color: '#888' }}>{p.label}</div>
                            <div style={{ fontSize: '9px', color: '#aaa' }}>{p.start}〜{p.end}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  {shiftData[`${shiftModal.staff}_${shiftModal.date}`] && (
                    <button onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      await supabase.from('staff_shifts').delete().eq('user_id', user.id).eq('staff_name', shiftModal.staff).eq('date', shiftModal.date);
                      await supabase.from('staff_attendance').delete().eq('user_id', user.id).eq('staff_name', shiftModal.staff).eq('date', shiftModal.date);
                      setShiftData(prev => { const n = { ...prev }; delete n[`${shiftModal.staff}_${shiftModal.date}`]; return n; });
                      setShiftModal(null);
                    }} style={{ padding: '12px 16px', borderRadius: '10px', border: '2px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>削除</button>
                  )}
                  <button onClick={() => setShiftModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}>キャンセル</button>
                  <button onClick={async () => {
                    if (!shiftModal) return;
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const key = `${shiftModal.staff}_${shiftModal.date}`;
                    const shiftTypeToSave = syncSchedule ? (shiftForm.shiftType.includes('[出勤]') ? shiftForm.shiftType : (shiftForm.shiftType + ' [出勤]').trim()) : shiftForm.shiftType.replace('[出勤]', '').trim();
                    if (shiftForm.isOff) {
                      await supabase.from('staff_shifts').upsert({
                        user_id: user.id, staff_name: shiftModal.staff, date: shiftModal.date,
                        start_time: null, end_time: null, is_off: true, shift_type: '休',
                      }, { onConflict: 'user_id,staff_name,date' });
                      setShiftData(prev => ({ ...prev, [key]: { staff_name: shiftModal.staff, date: shiftModal.date, is_off: true, shift_type: '休' } }));
                      await supabase.from('staff_attendance').delete().eq('user_id', user.id).eq('staff_name', shiftModal.staff).eq('date', shiftModal.date);
                    } else {
                      await supabase.from('staff_shifts').upsert({
                        user_id: user.id, staff_name: shiftModal.staff, date: shiftModal.date,
                        start_time: shiftForm.startTime, end_time: shiftForm.endTime, is_off: false, shift_type: shiftTypeToSave,
                      }, { onConflict: 'user_id,staff_name,date' });
                      setShiftData(prev => ({ ...prev, [key]: { staff_name: shiftModal.staff, date: shiftModal.date, start_time: shiftForm.startTime, end_time: shiftForm.endTime, is_off: false, shift_type: shiftTypeToSave } }));
                      if (syncSchedule) {
                        await supabase.from('staff_attendance').upsert({
                          user_id: user.id, staff_name: shiftModal.staff, date: shiftModal.date,
                        }, { onConflict: 'user_id,staff_name,date' });
                      } else {
                        await supabase.from('staff_attendance').delete().eq('user_id', user.id).eq('staff_name', shiftModal.staff).eq('date', shiftModal.date);
                      }
                    }
                    setShiftModal(null);
                  }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>💾 保存</button>
                </div>
              </div>
            </div>
          )}

          {/* パターン設定モーダル */}
          {editingPatterns && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingPatterns(false)}>
              <div style={{ width: '500px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>⚙ シフトパターン設定</span>
                  <span onClick={() => setEditingPatterns(false)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span>
                </div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>アルファベットに勤務時間を割り当てます</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {draftPatterns.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input value={p.code} onChange={e => { const n = [...draftPatterns]; n[idx] = { ...n[idx], code: e.target.value.toUpperCase().slice(0, 3) }; setDraftPatterns(n); }} placeholder="A" style={{ width: '50px', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }} />
                      <input value={p.label} onChange={e => { const n = [...draftPatterns]; n[idx] = { ...n[idx], label: e.target.value }; setDraftPatterns(n); }} placeholder="早番" style={{ width: '80px', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
                      <input type="time" value={p.start} onChange={e => { const n = [...draftPatterns]; n[idx] = { ...n[idx], start: e.target.value }; setDraftPatterns(n); }} style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
                      <span style={{ color: '#999' }}>〜</span>
                      <input type="time" value={p.end} onChange={e => { const n = [...draftPatterns]; n[idx] = { ...n[idx], end: e.target.value }; setDraftPatterns(n); }} style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
                      <button onClick={() => setDraftPatterns(draftPatterns.filter((_, i) => i !== idx))} style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setDraftPatterns([...draftPatterns, { code: String.fromCharCode(65 + draftPatterns.length), label: '', start: '09:00', end: '18:00' }])} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px dashed #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>＋ パターン追加</button>
                <button onClick={async () => {
                  const cleaned = draftPatterns.filter(p => p.code && p.start && p.end);
                  setShiftPatterns(cleaned);
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) await supabase.from('user_settings').upsert({ user_id: user.id, shift_patterns: cleaned, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
                  setEditingPatterns(false);
                }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>💾 保存</button>
              </div>
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

          {/* 請求管理 */}
          {activeMenu === 'billing' && !searchQuery && (() => {
            const today = new Date();
            const currentMonth = today.getFullYear() + '年' + (today.getMonth() + 1) + '月';
            const invoiceNo = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-${userId?.slice(0, 6).toUpperCase()}`;
            const taxRate = 0.10;
            const basePrice = 980;
            const tax = Math.floor(basePrice * taxRate);
            const total = basePrice + tax;

            const billingHistory = [];
            for (let i = 0; i < 6; i++) {
              const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
              billingHistory.push({
                month: `${d.getFullYear()}年${d.getMonth() + 1}月`,
                invoiceNo: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${userId?.slice(0, 6).toUpperCase()}`,
                date: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/01`,
                amount: total,
              });
            }

            return (
            <div>
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  [data-billing-print], [data-billing-print] * { visibility: visible; }
                  [data-billing-print] { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
                  [data-no-print] { display: none !important; }
                }
              `}</style>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }} data-no-print>
                <button onClick={() => window.print()} style={{ padding: '10px 20px', borderRadius: '10px', border: '2px solid #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🖨 明細書を印刷 / PDF保存</button>
              </div>

              <div data-billing-print style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '3px solid #1a1a2e', paddingBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e', letterSpacing: '3px' }}>請求明細書</div>
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>INVOICE</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a2e' }}>As-Works</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>ビジネス管理システム</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#999', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>ご請求先</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e' }}>{billingEmail}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>ユーザーID: {userId?.slice(0, 8)}...</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#999', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>請求情報</div>
                    <div style={{ fontSize: '13px', color: '#333' }}>請求書番号: {invoiceNo}</div>
                    <div style={{ fontSize: '13px', color: '#333', marginTop: '2px' }}>発行日: {today.toLocaleDateString('ja-JP')}</div>
                    <div style={{ fontSize: '13px', color: '#333', marginTop: '2px' }}>対象期間: {currentMonth}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666', borderBottom: '2px solid #e5e7eb' }}>項目</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666', borderBottom: '2px solid #e5e7eb' }}>数量</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666', borderBottom: '2px solid #e5e7eb' }}>単価</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666', borderBottom: '2px solid #e5e7eb' }}>金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#1a1a2e', borderBottom: '1px solid #f0f0f0' }}>
                          As-Works プレミアムプラン（月額）
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>顧客管理・WEB予約・台帳機能</div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#333', borderBottom: '1px solid #f0f0f0' }}>1</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#333', borderBottom: '1px solid #f0f0f0' }}>¥{basePrice.toLocaleString()}</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#1a1a2e', borderBottom: '1px solid #f0f0f0' }}>¥{basePrice.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                  <div style={{ width: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#555' }}>
                      <span>小計</span><span>¥{basePrice.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#555' }}>
                      <span>消費税（10%）</span><span>¥{tax.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', borderTop: '2px solid #1a1a2e', marginTop: '8px' }}>
                      <span>合計</span><span>¥{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #a7f3d0', marginBottom: '32px' }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669' }}>お支払い済み</div>
                    <div style={{ fontSize: '12px', color: '#10b981' }}>クレジットカードによる自動引き落とし</div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#999', lineHeight: '1.8', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>備考</div>
                  <div>・本請求書は As-Works プレミアムプランの月額利用料に関するものです。</div>
                  <div>・消費税は税率10%で計算しています。</div>
                  <div>・サブスクリプションはいつでもキャンセル可能です。</div>
                  <div>・ご不明な点がございましたらメッセージ機能よりお問い合わせください。</div>
                </div>
              </div>

              <div style={{ marginTop: '24px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }} data-no-print>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px' }}>📋 請求履歴</div>
                {billingHistory.map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a2e' }}>{b.month}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{b.invoiceNo}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e' }}>¥{b.amount.toLocaleString()}</div>
                      <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#059669', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>支払済</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })()}

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

          {/* 予約ページ設定セクション */}
          {activeMenu === 'settings' && !searchQuery && (
              <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '16px', overflow: 'hidden' }}>
                <div onClick={() => setOpenBookingSettings(!openBookingSettings)} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '4px' }}>📱 予約ページ設定</div><div style={{ fontSize: '13px', color: '#999' }}>お客様が見る予約ページの表示名・画像・デザインを管理します</div></div>
                  <span style={{ fontSize: '18px', color: '#c0c4d0', transition: 'transform 0.2s', transform: openBookingSettings ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: '16px' }}>▼</span>
                </div>
                {openBookingSettings && (
                  <div style={{ padding: '0 24px 24px', borderTop: '1px solid #f0f0f0' }}>

                    <div style={{ marginTop: '18px', marginBottom: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>🔗 予約ページURL</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 1, padding: '10px 14px', background: '#f8f9fa', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '12px', color: '#333', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                          {typeof window !== 'undefined' ? `${window.location.origin}/booking?owner=${userId}` : `/booking?owner=${userId}`}
                        </div>
                        <button onClick={() => {
                          const url = `${window.location.origin}/booking?owner=${userId}`;
                          navigator.clipboard.writeText(url);
                          setUrlCopied(true);
                          setTimeout(() => setUrlCopied(false), 2000);
                        }} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: urlCopied ? '#10b981' : '#6366f1', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {urlCopied ? '✓ コピー済み' : '📋 コピー'}
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>このURLをLINEやSNSに貼り付けてお客様に共有できます</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>🏪 表示名（店舗名）</div>
                      <textarea value={shopName} onChange={e => setShopName(e.target.value)} placeholder={'例:\n○○自動車\n○○店'} rows={2} style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>予約ページ上部に表示されます。Enterで改行できます</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>📝 説明文・キャッチコピー</div>
                      <textarea value={shopDescription} onChange={e => setShopDescription(e.target.value)} placeholder={'例:\n24時間WEB予約受付中\nお気軽にご予約ください'} rows={2} style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>店舗名の下に表示されます。Enterで改行できます</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>🖼 店舗画像・看板</div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        {shopImageUrl ? (
                          <div style={{ position: 'relative' }}>
                            <img src={shopImageUrl} alt="店舗画像" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e5e7eb' }} />
                            <button onClick={async () => {
                              setShopImageUrl('');
                              await supabase.from('user_settings').upsert({ user_id: userId, shop_image_url: '', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
                            }} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                          </div>
                        ) : (
                          <div style={{ width: '120px', height: '80px', borderRadius: '10px', border: '2px dashed #d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px' }}>未設定</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'inline-block', padding: '10px 16px', borderRadius: '8px', border: '2px solid #6366f1', background: 'white', color: '#6366f1', cursor: imageUploading ? 'default' : 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                            {imageUploading ? 'アップロード中...' : '📷 画像を選択'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={imageUploading} onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setImageUploading(true);
                              const ext = file.name.split('.').pop();
                              const path = `${userId}/shop-image-${Date.now()}.${ext}`;
                              const { error } = await supabase.storage.from('shop-images').upload(path, file, { upsert: true });
                              if (error) { alert('アップロードに失敗しました: ' + error.message); setImageUploading(false); return; }
                              const { data: urlData } = supabase.storage.from('shop-images').getPublicUrl(path);
                              setShopImageUrl(urlData.publicUrl);
                              await supabase.from('user_settings').upsert({ user_id: userId, shop_image_url: urlData.publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
                              setImageUploading(false);
                            }} />
                          </label>
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>ロゴや看板の写真を予約ページ上部に表示します</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>🎨 背景カラー</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {[
                          { color: '#1a1a2e', label: 'ダーク' },
                          { color: '#0f3460', label: 'ネイビー' },
                          { color: '#1e40af', label: 'ブルー' },
                          { color: '#065f46', label: 'グリーン' },
                          { color: '#7c2d12', label: 'ブラウン' },
                          { color: '#581c87', label: 'パープル' },
                          { color: '#be123c', label: 'レッド' },
                          { color: '#374151', label: 'グレー' },
                        ].map(c => (
                          <div key={c.color} onClick={() => setShopBgColor(c.color)} style={{ width: '44px', height: '44px', borderRadius: '10px', background: c.color, cursor: 'pointer', border: shopBgColor === c.color ? '3px solid #6366f1' : '2px solid #e5e7eb', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '2px', transition: 'transform 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}>
                            {shopBgColor === c.color && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                          </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                          <input type="color" value={shopBgColor} onChange={e => setShopBgColor(e.target.value)} style={{ width: '44px', height: '44px', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', padding: '2px' }} />
                          <span style={{ fontSize: '12px', color: '#999' }}>自由選択</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>🔤 店舗名の文字サイズ: {shopNameSize}px</div>
                      <input type="range" min="16" max="44" value={shopNameSize} onChange={e => setShopNameSize(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>🔤 説明文の文字サイズ: {shopDescSize}px</div>
                      <input type="range" min="10" max="28" value={shopDescSize} onChange={e => setShopDescSize(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    {shopImageUrl && (
                      <>
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>📐 画像サイズ: {shopImageSize}px</div>
                          <input type="range" min="40" max="300" value={shopImageSize} onChange={e => setShopImageSize(Number(e.target.value))} style={{ width: '100%' }} />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>📍 画像の位置: {shopImageX === 0 ? '左端' : shopImageX === 50 ? '中央' : shopImageX === 100 ? '右端' : `${shopImageX}%`}</div>
                          <input type="range" min="0" max="100" value={shopImageX} onChange={e => setShopImageX(Number(e.target.value))} style={{ width: '100%' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999', marginTop: '4px' }}><span>← 左</span><span>中央</span><span>右 →</span></div>
                        </div>
                      </>
                    )}

                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>👁 プレビュー</div>
                      <div style={{ background: `linear-gradient(135deg, ${shopBgColor} 0%, ${shopBgColor}dd 100%)`, borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'white' }}>
                        {shopImageUrl && (
                          <div style={{ display: 'flex', marginBottom: '10px' }}>
                            <img src={shopImageUrl} alt="" style={{ width: `${shopImageSize}px`, objectFit: 'contain', borderRadius: '8px', marginLeft: `${shopImageX}%`, transform: `translateX(-${shopImageX}%)` }} />
                          </div>
                        )}
                        <div style={{ fontSize: `${shopNameSize}px`, fontWeight: 'bold', letterSpacing: '2px', whiteSpace: 'pre-line' }}>{shopName || '（店舗名未設定）'}</div>
                        <div style={{ fontSize: `${shopDescSize}px`, opacity: 0.7, marginTop: '6px', whiteSpace: 'pre-line' }}>{shopDescription || 'オンライン予約'}</div>
                      </div>
                    </div>

                    <button onClick={async () => {
                      setShopSaving(true);
                      await supabase.from('user_settings').upsert({
                        user_id: userId, shop_name: shopName, shop_description: shopDescription,
                        shop_bg_color: shopBgColor, shop_image_url: shopImageUrl,
                        shop_name_size: shopNameSize, shop_desc_size: shopDescSize,
                        shop_image_size: shopImageSize, shop_image_x: shopImageX,
                        updated_at: new Date().toISOString(),
                      }, { onConflict: 'user_id' });
                      setShopSaving(false);
                      alert('保存しました！予約ページに反映されます。');
                    }} disabled={shopSaving} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: shopSaving ? '#ccc' : 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', cursor: shopSaving ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                      {shopSaving ? '保存中...' : '💾 保存する'}
                    </button>
                  </div>
                )}
              </div>
          )}

          {/* 顧客登録 */}
          {activeMenu === 'register' && !searchQuery && (
            <iframe src="/customer-register" style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', borderRadius: '16px' }} />
          )}

          {/* 顧客台帳 */}
          {activeMenu === 'customers' && !searchQuery && (
            <iframe src="/customers" style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', borderRadius: '16px' }} />
          )}

          {/* 準備中 */}
          {!searchQuery && !['reservations', 'stats', 'actions', 'message', 'billing', 'settings', 'inspection', 'shifts', 'register', 'customers'].includes(activeMenu) && (
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
