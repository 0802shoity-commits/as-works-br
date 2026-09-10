"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../lib/supabase';
import { getBusinessType } from '../lib/businessTypes';

const CATEGORY_COLORS = [
  { color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
  { color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  { color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  { color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
  { color: '#14b8a6', gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)' },
  { color: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
];

const AVATAR_GRADIENT = 'linear-gradient(135deg, #9ca3af, #6b7280)';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

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

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [customers, setCustomers] = useState<any[]>([]);
  const [allHistory, setAllHistory] = useState<any[]>([]);
  const [histories, setHistories] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'monthly'>('list');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [actionModal, setActionModal] = useState<any | null>(null);
  const [actionForm, setActionForm] = useState({ type: '', dueDate: '', notes: '' });
  const [savedCategories, setSavedCategories] = useState<any[]>([]);
  const [customerActions, setCustomerActions] = useState<{ [customerId: string]: CustomerAction }>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState('car');
  const [responseModal, setResponseModal] = useState<{ action: CustomerAction; customer: any } | null>(null);
  const [responseType, setResponseType] = useState('');
  const [responseNotes, setResponseNotes] = useState('');
  const [actionLogs, setActionLogs] = useState<{ [actionId: string]: any[] }>({});
  const [customerPastLogs, setCustomerPastLogs] = useState<{ [customerId: string]: any[] }>({});
  const [historyModal, setHistoryModal] = useState<any | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [detailValues, setDetailValues] = useState<{ [key: string]: string }>({});
  const [savingDetail, setSavingDetail] = useState(false);
  const [addWorkModal, setAddWorkModal] = useState<any | null>(null);
  const [newWork, setNewWork] = useState<{ workType: string; workDate: string; details: { [key: string]: string } }>({ workType: '', workDate: '', details: {} });
  const [savingWork, setSavingWork] = useState(false);
  const [selectedWorkCat, setSelectedWorkCat] = useState<string>('');
  const [expandedHistCat, setExpandedHistCat] = useState<{ [key: string]: boolean }>({});
  const [showPastLogs, setShowPastLogs] = useState<{ [customerId: string]: boolean }>({});
  const [selectedActionCat, setSelectedActionCat] = useState<string>('');
  const [dateMode, setDateMode] = useState<'registered' | 'lastVisit'>('registered');

  const bt = getBusinessType(businessType);
  const isCar = businessType === 'car';

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUserId(user.id);

      const { data } = await supabase.from('customers').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setCustomers(data);

      const { data: histData } = await supabase.from('customer_work_history').select('*').eq('user_id', user.id).order('work_date', { ascending: false });
      if (histData) {
        setAllHistory(histData);
        const histMap: { [key: string]: any[] } = {};
        histData.forEach((h: any) => { if (!histMap[h.customer_id]) histMap[h.customer_id] = []; histMap[h.customer_id].push(h); });
        setHistories(histMap);
      }

      const { data: catData } = await supabase.from('work_categories').select('categories').eq('user_id', user.id).single();
      if (catData?.categories) setSavedCategories(catData.categories);

      const { data: settingsData } = await supabase.from('user_settings').select('business_type').eq('user_id', user.id).single();
      if (settingsData?.business_type) setBusinessType(settingsData.business_type);

      const { data: planData } = await supabase.from('user_plans').select('plan').eq('user_id', user.id).single();
      setUserPlan(planData?.plan || 'free');

      const { data: actionsData } = await supabase
        .from('customer_actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (actionsData) {
        const map: { [customerId: string]: CustomerAction } = {};
        actionsData.forEach((a: CustomerAction) => { if (!map[a.customer_id]) map[a.customer_id] = a; });
        setCustomerActions(map);
      }

      const { data: allActionsData } = await supabase
        .from('customer_actions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: logsData } = await supabase
        .from('customer_action_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (logsData) {
        const logMap: { [actionId: string]: any[] } = {};
        logsData.forEach((l: any) => { if (!logMap[l.action_id]) logMap[l.action_id] = []; logMap[l.action_id].push(l); });
        setActionLogs(logMap);

        if (allActionsData) {
          const pastMap: { [customerId: string]: any[] } = {};
          allActionsData.filter((a: any) => a.status === 'done').forEach((a: any) => {
            const logs = logMap[a.id] || [];
            if (logs.length > 0) {
              if (!pastMap[a.customer_id]) pastMap[a.customer_id] = [];
              pastMap[a.customer_id].push({ actionType: a.action_type, scheduledDate: a.scheduled_date, logs });
            }
          });
          setCustomerPastLogs(pastMap);
        }
      }

      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId || customers.length === 0) return;
    const target = customers.find(c => String(c.id) === String(highlightId));
    if (target) {
      setExpandedId(target.id);
      setTimeout(() => {
        const el = document.getElementById(`customer-${target.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [searchParams, customers]);

  const handleSaveAction = async () => {
    if (!actionForm.type) { alert('アクション内容を選択してください'); return; }
    if (!currentUserId || !actionModal) return;
    const existing = customerActions[actionModal.id];
    if (existing) {
      const { data, error } = await supabase.from('customer_actions').update({
        action_type: actionForm.type, scheduled_date: actionForm.dueDate || null, notes: actionForm.notes || null,
      }).eq('id', existing.id).select().single();
      if (error) { alert('保存に失敗しました: ' + error.message); return; }
      if (data) setCustomerActions(prev => ({ ...prev, [actionModal.id]: data }));
    } else {
      const { data, error } = await supabase.from('customer_actions').insert({
        user_id: currentUserId, customer_id: actionModal.id, customer_name: actionModal.name,
        action_type: actionForm.type, scheduled_date: actionForm.dueDate || null, notes: actionForm.notes || null, status: 'pending',
      }).select().single();
      if (error) { alert('保存に失敗しました: ' + error.message); return; }
      if (data) setCustomerActions(prev => ({ ...prev, [actionModal.id]: data }));
    }
    setActionModal(null);
  };

  const handleCancelAction = async (customerId: string, actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('次回アクションを解除しますか？')) return;
    await supabase.from('customer_actions').update({ status: 'done' }).eq('id', actionId);
    setCustomerActions(prev => { const n = { ...prev }; delete n[customerId]; return n; });
    const action = Object.values(customerActions).find(a => a.id === actionId);
    if (action && actionLogs[actionId]?.length > 0) {
      setCustomerPastLogs(prev => ({
        ...prev,
        [customerId]: [...(prev[customerId] || []), { actionType: action.action_type, scheduledDate: action.scheduled_date, logs: actionLogs[actionId] }],
      }));
    }
  };

  const handleResponse = async () => {
    if (!responseType || !responseModal || !currentUserId) return;
    const { data: logData } = await supabase.from('customer_action_logs').insert({
      action_id: responseModal.action.id, user_id: currentUserId, log_type: responseType, notes: responseNotes || null,
    }).select().single();
    if (logData) {
      setActionLogs(prev => ({ ...prev, [responseModal.action.id]: [...(prev[responseModal.action.id] || []), logData] }));
    }
    if (responseType === '対応済み') {
      await supabase.from('customer_actions').update({ status: 'done' }).eq('id', responseModal.action.id);
      setCustomerActions(prev => { const n = { ...prev }; delete n[responseModal.customer.id]; return n; });
      const allLogs = [...(actionLogs[responseModal.action.id] || []), ...(logData ? [logData] : [])];
      if (allLogs.length > 0) {
        setCustomerPastLogs(prev => ({
          ...prev,
          [responseModal.customer.id]: [...(prev[responseModal.customer.id] || []), { actionType: responseModal.action.action_type, scheduledDate: responseModal.action.scheduled_date, logs: allLogs }],
        }));
      }
    }
    setResponseModal(null); setResponseType(''); setResponseNotes('');
  };

  const categoryMap = useMemo(() => {
    const map: { [itemTitle: string]: string } = {};
    savedCategories.forEach(cat => { if (cat.items) { cat.items.forEach((item: any) => { map[item.title] = cat.category; }); } });
    return map;
  }, [savedCategories]);

  const dynamicCategories = useMemo(() => {
    if (savedCategories.length === 0) {
      const types = [...new Set(allHistory.map(h => h.work_type).filter(Boolean))];
      const cats = types.map((type, idx) => ({ key: type, label: type, icon: '📋', color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length].color, gradient: CATEGORY_COLORS[idx % CATEGORY_COLORS.length].gradient }));
      return [{ key: 'all', label: 'すべて', icon: '📋', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' }, ...cats];
    }
    const cats = savedCategories.map((cat, idx) => ({
      key: cat.category, label: cat.category, icon: '📋',
      color: cat.borderColor || CATEGORY_COLORS[idx % CATEGORY_COLORS.length].color,
      gradient: `linear-gradient(135deg, ${cat.borderColor || CATEGORY_COLORS[idx % CATEGORY_COLORS.length].color}, ${cat.borderColor || CATEGORY_COLORS[idx % CATEGORY_COLORS.length].color}dd)`,
    }));
    return [{ key: 'all', label: 'すべて', icon: '📋', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' }, ...cats];
  }, [savedCategories, allHistory]);

  const activeCatInfo = dynamicCategories.find(c => c.key === activeCategory) || dynamicCategories[0];

  const getInspectionStatus = (date: string) => {
    if (!date) return null;
    const diffDays = Math.floor((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: '期限切れ', color: '#ef4444', bg: '#fff0f0' };
    if (diffDays <= 30) return { label: `あと${diffDays}日`, color: '#f59e0b', bg: '#fffbeb' };
    if (diffDays <= 90) return { label: `あと${diffDays}日`, color: '#10b981', bg: '#f0fdf4' };
    return { label: `あと${diffDays}日`, color: '#6366f1', bg: '#f0f0ff' };
  };

  const getCustomerCategory = (customerId: string) => {
    const hist = histories[customerId] || [];
    if (savedCategories.length > 0) return new Set(hist.map(h => categoryMap[h.work_type]).filter(Boolean));
    return new Set(hist.map(h => h.work_type).filter(Boolean));
  };

  const getMonthCount = (month: number) => allHistory.filter(h => {
    if (!h.work_date) return false; const d = new Date(h.work_date);
    if (d.getFullYear() !== selectedYear || d.getMonth() !== month) return false;
    if (activeCategory !== 'all') { const cat = savedCategories.length > 0 ? (categoryMap[h.work_type] || h.work_type) : h.work_type; if (cat !== activeCategory) return false; }
    if (activeItem && h.work_type !== activeItem) return false;
    return true;
  }).length;

  const getMonthCustomers = (month: number) => {
    const monthHist = allHistory.filter(h => {
      if (!h.work_date) return false; const d = new Date(h.work_date);
      if (d.getFullYear() !== selectedYear || d.getMonth() !== month) return false;
      if (activeCategory !== 'all') { const cat = savedCategories.length > 0 ? (categoryMap[h.work_type] || h.work_type) : h.work_type; if (cat !== activeCategory) return false; }
      if (activeItem && h.work_type !== activeItem) return false;
      return true;
    });
    const customerIds = [...new Set(monthHist.map(h => h.customer_id))];
    return customerIds.map(id => { const customer = customers.find(c => c.id === id); const works = monthHist.filter(h => h.customer_id === id); return { customer, works }; }).filter(c => c.customer);
  };

  const filtered = customers.filter(c => {
    if (searchQuery) { const q = searchQuery.toLowerCase(); if (!(c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.car_model?.toLowerCase().includes(q) || c.car_number?.toLowerCase().includes(q))) return false; }
    if (activeCategory !== 'all') { if (!getCustomerCategory(c.id).has(activeCategory)) return false; }
    if (activeItem) { const hist = histories[c.id] || []; if (!hist.some(h => h.work_type === activeItem)) return false; }
    return true;
  });

  const getCategoryCount = (catKey: string) => catKey === 'all' ? customers.length : customers.filter(c => getCustomerCategory(c.id).has(catKey)).length;

  const getCustomerSubInfo = (customer: any) => {
    if (isCar) return customer.car_model || '';
    const cf = customer.custom_fields || {};
    const firstTextField = bt.fields.find(f => f.type === 'text');
    return firstTextField ? (cf[firstTextField.key] || '') : '';
  };

  const isPremium = userPlan === 'premium';

  const getDetailFields = (workType: string): { label: string }[] => {
    for (const cat of savedCategories) {
      const item = (cat.items || []).find((i: any) => i.title === workType);
      if (item) return item.detailFields || [];
    }
    return [];
  };

  const saveHistoryDetail = async () => {
    if (!historyModal) return;
    setSavingDetail(true);
    await supabase.from('customer_work_history').update({ custom_details: detailValues }).eq('id', historyModal.id);
    setHistories(prev => {
      const n = { ...prev };
      Object.keys(n).forEach(cid => { n[cid] = n[cid].map(h => h.id === historyModal.id ? { ...h, custom_details: detailValues } : h); });
      return n;
    });
    setAllHistory(prev => prev.map(h => h.id === historyModal.id ? { ...h, custom_details: detailValues } : h));
    setSavingDetail(false);
    setHistoryModal(null);
  };

  const allWorkItems = useMemo(() => {
    const list: { category: string; title: string; color: string; borderColor: string }[] = [];
    savedCategories.forEach(cat => {
      (cat.items || []).forEach((item: any) => {
        list.push({ category: cat.category, title: item.title, color: item.color || '#f8f9fa', borderColor: item.borderColor || '#6366f1' });
      });
    });
    return list;
  }, [savedCategories]);

  const addWorkHistory = async () => {
    if (!newWork.workType) { alert('作業項目を選択してください'); return; }
    if (!newWork.workDate) { alert('日付を選択してください'); return; }
    if (!currentUserId || !addWorkModal) return;
    setSavingWork(true);
    const { data, error } = await supabase.from('customer_work_history').insert({
      user_id: currentUserId,
      customer_id: addWorkModal.id,
      work_type: newWork.workType,
      work_date: newWork.workDate,
      custom_details: newWork.details,
    }).select().single();
    if (error) { alert('保存に失敗しました: ' + error.message); setSavingWork(false); return; }
    if (data) {
      setHistories(prev => ({ ...prev, [addWorkModal.id]: [data, ...(prev[addWorkModal.id] || [])] }));
      setAllHistory(prev => [data, ...prev]);
    }
    setSavingWork(false);
    setAddWorkModal(null);
    setNewWork({ workType: '', workDate: '', details: {} });
  };

  const deleteWorkHistory = async (historyId: string, customerId: string) => {
    if (!window.confirm('この作業履歴を削除しますか？')) return;
    await supabase.from('customer_work_history').delete().eq('id', historyId);
    setHistories(prev => {
      const n = { ...prev };
      if (n[customerId]) n[customerId] = n[customerId].filter(h => h.id !== historyId);
      return n;
    });
    setAllHistory(prev => prev.filter(h => h.id !== historyId));
  };

  const getDateDisplay = (customer: any) => {
    if (dateMode === 'registered') {
      if (!customer.created_at) return { main: '—', sub: '' };
      const d = new Date(customer.created_at);
      return { main: d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }), sub: d.getFullYear().toString() };
    } else {
      const h = histories[customer.id];
      const last = h?.[0]?.work_date;
      if (!last) return { main: '—', sub: '' };
      const d = new Date(last);
      return { main: d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }), sub: d.getFullYear().toString() };
    }
  };

 const renderCustomerCard = (customer: any) => {
    const isExpanded = expandedId === customer.id;
    const isHover = hoverId === customer.id;
    const inspStatus = getInspectionStatus(customer.inspection_date);
    const history = histories[customer.id] || [];
    const action = customerActions[customer.id];
    const subInfo = getCustomerSubInfo(customer);
    const cf = customer.custom_fields || {};
    const isBlack = cf.is_blacklist === true;
    const groupedHistory: { [catName: string]: any[] } = {};
    history.forEach((h: any) => {
      const catName = savedCategories.length > 0 ? (categoryMap[h.work_type] || 'その他') : (h.work_type || 'その他');
      if (!groupedHistory[catName]) groupedHistory[catName] = [];
      groupedHistory[catName].push(h);
    });

    return (
      <div key={customer.id} style={{ marginBottom: '10px' }}>
      <div
        id={`customer-${customer.id}`}
        onMouseEnter={() => setHoverId(customer.id)}
        onMouseLeave={() => setHoverId(null)}
        style={{
          background: isBlack ? '#fef2f2' : 'white', borderRadius: '14px',
          boxShadow: isHover || isExpanded ? '0 8px 24px rgba(99,102,241,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          borderLeft: isBlack ? '6px solid #ef4444' : `6px solid ${isExpanded ? '#6366f1' : isHover ? '#a5b4fc' : '#e5e7eb'}`,
          borderTop: isBlack ? '2px solid #fca5a5' : isExpanded ? '2px solid #a5b4fc' : '2px solid #eef0f5',
          borderRight: isBlack ? '2px solid #fca5a5' : isExpanded ? '2px solid #a5b4fc' : '2px solid #eef0f5',
          borderBottom: isBlack ? '2px solid #fca5a5' : isExpanded ? '2px solid #a5b4fc' : '2px solid #eef0f5',
          transform: isHover && !isExpanded ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* 閉じた状態 — 名前・電話・住所・車種が見える */}
        <div onClick={() => setExpandedId(isExpanded ? null : customer.id)} style={{ padding: '16px 20px', cursor: 'pointer' }}>
          {/* 1行目: 名前(大) + BL + アクション + 電話 ... 車種カード ... 編集・履歴 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: isBlack ? '#dc2626' : '#1a1a2e', flexShrink: 0 }}>{customer.name}</div>
              {isBlack && <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#ef4444', color: 'white', padding: '2px 10px', borderRadius: '6px', flexShrink: 0 }}>BL</span>}
              {action && <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: '#fef3c7', color: '#b45309', flexShrink: 0 }}></span>}
              <span style={{ fontSize: '14px', color: '#6b7280', flexShrink: 0 }}>{customer.phone || ''}</span>
            </div>
            <div style={{ flex: 1 }} />
            {isCar && customer.car_model && (
              <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '8px 16px', flexShrink: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e' }}>{customer.car_model}</div>
                {customer.car_number && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{customer.car_number}</div>}
              </div>
            )}
            {!isCar && (() => {
              const fields = bt.fields.filter((f: any) => f.type !== 'textarea').slice(0, 2);
              const val0 = cf[fields[0]?.key];
              const val1 = cf[fields[1]?.key];
              if (!val0 && !val1) return null;
              return (
                <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '8px 16px', flexShrink: 0, textAlign: 'center' }}>
                  {val0 && <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e' }}>{bt.icon} {val0}</div>}
                  {val1 && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{val1}</div>}
                </div>
              );
            })()}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button onClick={(e) => { e.stopPropagation(); router.push(`/customer-register?edit=${customer.id}`); }} style={{ padding: '5px 12px', borderRadius: '8px', border: '2px solid #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}> 編集</button>
              {history.length > 0 && <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: '#e8f5e9', color: '#047857' }}>履歴 {history.length}件</span>}
              <span style={{ fontSize: '14px', color: '#c0c4d0', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>
          </div>
          {/* 2行目: 左に住所、右に車検バッジ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              {customer.address && <span style={{ fontSize: '13px', color: '#6b7280' }}>{customer.address}</span>}
            </div>
            {isCar && inspStatus && (
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: inspStatus.color, background: inspStatus.bg, padding: '3px 10px', borderRadius: '8px', border: `1px solid ${inspStatus.color}30`, flexShrink: 0 }}>車検 {inspStatus.label}</span>
            )}
          </div>
        </div>

        {/* 展開した状態 */}
        {isExpanded && (
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isCar && !customer.inspection_date ? '1fr' : (isCar ? 'auto 1fr' : '1fr 2fr'), gap: '20px', marginBottom: '16px' }}>
              {/* 左: 基本情報（車ナンバーは閉じた状態で表示済み） */}
              {(isCar ? customer.inspection_date : true) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isCar ? null : (
                  bt.fields.filter(f => f.type !== 'textarea').map(f => (
                    <div key={f.key} style={{ background: '#f8f9fa', borderRadius: '10px', padding: '12px 14px' }}><div style={{ fontSize: '11px', color: '#8b90a0', marginBottom: '4px' }}>{f.label}</div><div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{cf[f.key] || '未登録'}</div></div>
                  ))
                )}
                {isCar && customer.inspection_date && (
                  <div style={{ background: inspStatus?.bg || '#f8f9fa', borderRadius: '10px', padding: '12px 14px', border: `1px solid ${inspStatus?.color || '#e5e7eb'}30`, minWidth: '160px' }}><div style={{ fontSize: '11px', color: '#8b90a0', marginBottom: '4px' }}>車検満了日</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: inspStatus?.color || '#333', letterSpacing: '1px' }}>{customer.inspection_date}</div><div style={{ fontSize: '12px', color: inspStatus?.color || '#888', marginTop: '2px' }}>{inspStatus?.label}</div></div>
                )}
              </div>
              )}

              {/* 右: 作業履歴 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a2e' }}>作業履歴</div>
                  <button onClick={(e) => { e.stopPropagation(); setAddWorkModal(customer); setNewWork({ workType: '', workDate: new Date().toLocaleDateString('sv-SE'), details: {} }); }} style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>＋ 作業を追加</button>
                </div>
                {history.length === 0 ? (
                  <div style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '10px' }}>作業履歴がありません</div>
                ) : (
                  Object.entries(groupedHistory).map(([catName, items]) => {
                    const catInfo = dynamicCategories.find(c => c.key === catName);
                    const catColor = catInfo?.color || '#6366f1';
                    const histKey = `${customer.id}-${catName}`;
                    const isOpen = expandedHistCat[histKey];
                    return (
                      <div key={catName} style={{ marginBottom: '8px' }}>
                        <div onClick={(e) => { e.stopPropagation(); setExpandedHistCat(prev => ({ ...prev, [histKey]: !prev[histKey] })); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: catColor, padding: '10px 14px', background: `${catColor}12`, borderRadius: '10px', cursor: 'pointer' }}>
                          <span>{catName}（{items.length}件）</span>
                          <span style={{ fontSize: '11px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </div>
                        {isOpen && (
                          <div style={{ marginTop: '6px' }}>
                            {items.map(h => (
                              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderRadius: '8px', background: 'white', border: '1px solid #eef0f5', marginBottom: '4px', transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${catColor}0a`; (e.currentTarget as HTMLElement).style.borderColor = catColor; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#eef0f5'; }}>
                                <div style={{ width: '3px', height: '24px', borderRadius: '2px', background: catColor, flexShrink: 0 }} />
                                <div onClick={(e) => { e.stopPropagation(); setHistoryModal({ ...h, catColor }); setDetailValues(h.custom_details || {}); }} style={{ flex: 1, fontSize: '12px', fontWeight: '600', color: '#333', cursor: 'pointer' }}>{h.work_type}</div>
                                <div style={{ fontSize: '11px', color: catColor, fontWeight: '600' }}>{h.work_date}</div>
                                <button onClick={(e) => { e.stopPropagation(); deleteWorkHistory(h.id, customer.id); }} style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #fca5a5', background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', flexShrink: 0, opacity: 0.5 }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.5'}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {action && (
              <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '2px solid #fcd34d', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (actionLogs[action.id]?.length > 0) ? '10px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}></span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#92400e' }}>{action.action_type}</div>
                      <div style={{ fontSize: '12px', color: '#b45309' }}>{action.scheduled_date || '期日未定'}{action.notes && ` ・${action.notes}`}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={(e) => { e.stopPropagation(); setResponseModal({ action, customer }); setResponseType(''); setResponseNotes(''); }} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>対応</button>
                    <button onClick={(e) => handleCancelAction(customer.id, action.id, e)} style={{ padding: '6px 10px', borderRadius: '8px', border: '2px solid #d97706', background: 'white', color: '#d97706', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>×</button>
                  </div>
                </div>
                {actionLogs[action.id]?.length > 0 && (
                  <div style={{ borderTop: '1px solid #fde68a', paddingTop: '8px' }}>
                    {actionLogs[action.id].map((log: any) => (
                      <div key={log.id} style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '4px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#d97706', flexShrink: 0 }}>•</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 'bold', color: log.log_type === '対応済み' ? '#16a34a' : log.log_type === '電話に出なかった' ? '#dc2626' : '#92400e' }}>{log.log_type}</span>
                          {log.notes && <span style={{ color: '#92400e' }}> ・{log.notes}</span>}
                          <span style={{ color: '#d97706', marginLeft: '8px' }}>{new Date(log.created_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {customerPastLogs[customer.id]?.length > 0 && (() => {
              const totalLogs = customerPastLogs[customer.id].reduce((sum: number, p: any) => sum + p.logs.length, 0);
              const open = showPastLogs[customer.id];
              const typeColor = (t: string) => t === '対応済み' ? '#16a34a' : t === '電話に出なかった' ? '#dc2626' : t === 'キャンセル' ? '#9ca3af' : '#6366f1';
              const typeBg = (t: string) => t === '対応済み' ? '#dcfce7' : t === '電話に出なかった' ? '#fee2e2' : t === 'キャンセル' ? '#f3f4f6' : '#eef2ff';
              return (
              <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
                <div onClick={(e) => { e.stopPropagation(); setShowPastLogs(prev => ({ ...prev, [customer.id]: !prev[customer.id] })); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>過去の対応履歴 <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>（{totalLogs}件）</span></div>
                  <span style={{ fontSize: '11px', color: '#9ca3af', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>
                {open && (
                  <div style={{ marginTop: '12px' }}>
                    {customerPastLogs[customer.id].map((past: any, pIdx: number) => (
                      <div key={pIdx} style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '3px 10px', borderRadius: '8px', fontSize: '12px' }}>{past.actionType}</span>
                          {past.scheduledDate && <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'normal' }}>{past.scheduledDate}</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '4px' }}>
                          {past.logs.map((log: any) => (
                            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #eef0f5' }}>
                              <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0, width: '62px' }}>{new Date(log.created_at).toLocaleDateString('ja-JP')}</span>
                              <span style={{ fontWeight: 'bold', color: typeColor(log.log_type), background: typeBg(log.log_type), padding: '3px 10px', borderRadius: '6px', fontSize: '12px', flexShrink: 0 }}>{log.log_type}</span>
                              {log.notes && <span style={{ color: '#555', fontSize: '13px' }}>{log.notes}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={(e) => { e.stopPropagation(); setActionModal(customer); setSelectedActionCat(''); setActionForm(action ? { type: action.action_type, dueDate: action.scheduled_date || '', notes: action.notes || '' } : { type: '', dueDate: '', notes: '' }); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: action ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>{action ? 'アクション変更' : '次回アクション'}</button>
              <button onClick={async () => { if (!window.confirm(`${customer.name}さんを削除しますか？`)) return; await supabase.from('customers').delete().eq('id', customer.id); setCustomers(prev => prev.filter(c => c.id !== customer.id)); }} style={{ padding: '12px 20px', borderRadius: '10px', border: '2px solid #ff5252', background: 'white', color: '#ff5252', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>削除</button>
            </div>
          </div>
        )}
      </div>
      </div>
    );
  };


  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1;filter:brightness(1.2)}50%{opacity:.3;filter:brightness(.4)}}@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
      <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: '160px', height: '160px', borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#ff1493', borderRightColor: '#ff69b4', animation: 'spin 1.2s linear infinite' }} />
        <div style={{ position: 'absolute', width: '140px', height: '140px', borderRadius: '50%', border: '3px solid transparent', borderBottomColor: '#ff1493', borderLeftColor: '#ff69b4', animation: 'spin 1.8s linear infinite reverse' }} />
        <img src="/awwork.png" alt="Loading" style={{ width: '90px', height: '90px', objectFit: 'contain', animation: 'pulse 2s ease-in-out infinite' }} />
      </div>
      <div style={{ marginTop: '30px', color: '#ff1493', fontSize: '14px', fontWeight: 'bold', letterSpacing: '3px', animation: 'pulse 2s ease-in-out infinite' }}>お待ちください...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f5f6fb 0%, #eef1f8 100%)', fontFamily: "'Segoe UI', sans-serif" }}>

      {addWorkModal && (() => {
        const selectedFields = newWork.workType
          ? (allWorkItems.find(w => w.title === newWork.workType) ? getDetailFields(newWork.workType) : [])
          : [];
        return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAddWorkModal(null)}>
          <div style={{ width: '480px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>＋ 作業履歴を追加</span>
              <span onClick={() => setAddWorkModal(null)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span>
            </div>
            <div style={{ fontSize: '13px', color: '#8b90a0', marginBottom: '20px' }}>{addWorkModal.name}さんの来店・作業を記録します</div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>作業項目</div>
              {savedCategories.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#bbb', padding: '12px', background: '#f8f9fa', borderRadius: '10px' }}>作業項目がありません。ダッシュボードの「項目追加」から登録してください。</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {savedCategories.map(cat => {
                    if (!cat.items || cat.items.length === 0) return null;
                    const isCatOpen = expandedHistCat[`modal-${cat.category}`];
                    return (
                      <div key={cat.category}>
                        <div onClick={() => setExpandedHistCat(prev => ({ ...prev, [`modal-${cat.category}`]: !prev[`modal-${cat.category}`] }))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: cat.color || '#f8f9fa', border: `2px solid ${cat.borderColor || '#e5e7eb'}`, borderRadius: '10px', padding: '12px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                          <span>{cat.category} ▶</span>
                          <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', transform: isCatOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                        </div>
                        {isCatOpen && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px', padding: '8px 4px' }}>
                            {cat.items.map((item: any) => (
                              <div key={item.title} onClick={() => setNewWork({ ...newWork, workType: item.title, details: {} })} style={{ padding: '10px', borderRadius: '8px', border: `2px solid ${newWork.workType === item.title ? (item.borderColor || '#6366f1') : '#e5e7eb'}`, background: newWork.workType === item.title ? (item.color || '#f0f0ff') : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: newWork.workType === item.title ? 'bold' : 'normal', textAlign: 'center', color: '#333' }}>{item.title}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>作業日</div>
              <input type="date" value={newWork.workDate} onChange={e => setNewWork({ ...newWork, workDate: e.target.value })} style={{ width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            {newWork.workType && selectedFields.length > 0 && (
              <div style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #f8f9ff, #f1f3fb)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6366f1', marginBottom: '12px', fontWeight: 'bold' }}>📝 {newWork.workType} の記録</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedFields.map((f, idx) => (
                    <div key={idx}>
                      <div style={{ fontSize: '12px', color: '#8b90a0', marginBottom: '5px', fontWeight: 'bold' }}>{f.label}</div>
                      <input value={newWork.details[f.label] || ''} onChange={e => setNewWork({ ...newWork, details: { ...newWork.details, [f.label]: e.target.value } })} placeholder={`${f.label}を入力`} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: 'white' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {newWork.workType && selectedFields.length === 0 && (
              <div style={{ marginBottom: '16px', fontSize: '12px', color: '#8b90a0', background: '#f8f9fa', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>この項目には記録欄が未設定です（予約管理の⚙️設定で作成できます）</div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setAddWorkModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}>キャンセル</button>
              <button onClick={addWorkHistory} disabled={savingWork} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: savingWork ? '#ccc' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: savingWork ? 'default' : 'pointer', fontWeight: 'bold' }}>{savingWork ? '保存中...' : '💾 記録する'}</button>
            </div>
          </div>
        </div>
        );
      })()}

      {historyModal && (() => {
        const fields = getDetailFields(historyModal.work_type);
        return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setHistoryModal(null)}>
          <div style={{ width: '460px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 作業内容の詳細</span>
              <span onClick={() => setHistoryModal(null)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{ width: '5px', height: '44px', borderRadius: '3px', background: historyModal.catColor || '#6366f1', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a2e' }}>{historyModal.work_type}</div>
                <div style={{ fontSize: '13px', color: '#8b90a0', marginTop: '2px' }}>📅 {historyModal.work_date || '日付未登録'}</div>
              </div>
            </div>

            {fields.length === 0 ? (
              <div style={{ background: 'linear-gradient(135deg, #f8f9ff, #f1f3fb)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#8b90a0', marginBottom: '8px' }}>この項目には記録欄がまだ設定されていません</div>
                <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 'bold' }}>予約管理の「⚙️ 設定」から記録欄を作成できます</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {fields.map((f, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: '12px', color: '#8b90a0', marginBottom: '6px', fontWeight: 'bold' }}>{f.label}</div>
                    {isPremium ? (
                      <input value={detailValues[f.label] || ''} onChange={e => setDetailValues({ ...detailValues, [f.label]: e.target.value })} placeholder={`${f.label}を入力`} style={{ width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                    ) : (
                      <div style={{ padding: '11px 14px', background: '#f8f9fa', borderRadius: '10px', fontSize: '14px', color: '#333', minHeight: '20px' }}>{detailValues[f.label] || '—'}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isPremium && fields.length > 0 && (
              <div style={{ marginTop: '14px', fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', textAlign: 'center' }}>🔒 編集は有料プランのみ</div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setHistoryModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}>閉じる</button>
              {isPremium && fields.length > 0 && (
                <button onClick={saveHistoryDetail} disabled={savingDetail} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: savingDetail ? '#ccc' : 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', cursor: savingDetail ? 'default' : 'pointer', fontWeight: 'bold' }}>{savingDetail ? '保存中...' : '💾 保存'}</button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {responseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setResponseModal(null)}>
          <div style={{ width: '440px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}><span>📝 対応記録</span><span onClick={() => setResponseModal(null)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span></div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{responseModal.customer.name}さん ・ {responseModal.action.action_type}</div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>対応内容</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['予約済み', '電話に出なかった', '再度連絡予定', '見積もり送付済み', 'キャンセル', '対応済み'].map(type => (
                  <div key={type} onClick={() => setResponseType(type)} style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${responseType === type ? (type === '対応済み' ? '#16a34a' : type === '電話に出なかった' ? '#dc2626' : '#6366f1') : '#e5e7eb'}`, background: responseType === type ? (type === '対応済み' ? '#f0fdf4' : type === '電話に出なかった' ? '#fef2f2' : '#f0f0ff') : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: responseType === type ? 'bold' : 'normal', textAlign: 'center', color: responseType === type ? (type === '対応済み' ? '#16a34a' : type === '電話に出なかった' ? '#dc2626' : '#6366f1') : '#555' }}>{type}</div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>メモ</div>
              <textarea value={responseNotes} onChange={e => setResponseNotes(e.target.value)} placeholder="対応内容の詳細など" style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }} />
            </div>
            {actionLogs[responseModal.action.id]?.length > 0 && (
              <div style={{ marginBottom: '20px', background: '#f8f9fa', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>📋 対応履歴</div>
                {actionLogs[responseModal.action.id].map((log: any) => (
                  <div key={log.id} style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: '#999', flexShrink: 0 }}>{new Date(log.created_at).toLocaleDateString('ja-JP')}</span>
                    <span style={{ fontWeight: 'bold', color: log.log_type === '対応済み' ? '#16a34a' : log.log_type === '電話に出なかった' ? '#dc2626' : '#333' }}>{log.log_type}</span>
                    {log.notes && <span style={{ color: '#666' }}>・{log.notes}</span>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setResponseModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={handleResponse} disabled={!responseType} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: !responseType ? '#ccc' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', cursor: !responseType ? 'default' : 'pointer', fontWeight: 'bold' }}>記録する</button>
            </div>
          </div>
        </div>
      )}

      {actionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,20,40,0.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setActionModal(null)}>
          <div style={{ width: '440px', background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}><span>次回アクション設定</span><span onClick={() => setActionModal(null)} style={{ cursor: 'pointer', color: '#ccc' }}>×</span></div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{actionModal.name}さんへのフォローアップ</div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>アクション内容</div>
              {savedCategories.filter(cat => (cat.actionTypes || []).length > 0).length === 0 ? (
                <div style={{ fontSize: '13px', color: '#bbb', textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>アクションが未設定です。予約管理の「⚙️ 設定」で登録してください。</div>
              ) : !selectedActionCat ? (
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>カテゴリーを選択</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {savedCategories.filter(cat => (cat.actionTypes || []).length > 0).map(cat => (
                      <div key={cat.category} onClick={() => setSelectedActionCat(cat.category)} style={{ padding: '14px', borderRadius: '10px', border: `2px solid ${cat.borderColor || '#6366f1'}`, background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', color: '#1a1a2e', transition: 'all 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${cat.borderColor || '#6366f1'}15`} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}>{cat.category}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <button onClick={() => { setSelectedActionCat(''); setActionForm({ ...actionForm, type: '' }); }} style={{ padding: '5px 10px', borderRadius: '8px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#666' }}>← 戻る</button>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: savedCategories.find(c => c.category === selectedActionCat)?.borderColor || '#6366f1' }}>🔔 {selectedActionCat}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {(savedCategories.find(c => c.category === selectedActionCat)?.actionTypes || []).map((type: string) => (
                      <div key={type} onClick={() => setActionForm({ ...actionForm, type })} style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${actionForm.type === type ? '#6366f1' : '#e5e7eb'}`, background: actionForm.type === type ? '#f0f0ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: actionForm.type === type ? 'bold' : 'normal', textAlign: 'center', color: actionForm.type === type ? '#6366f1' : '#555' }}>{type}</div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', textAlign: 'right' }}>選択肢は予約管理の「⚙️ 設定」で編集できます</div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>期日</div>
              <input type="date" value={actionForm.dueDate} onChange={e => setActionForm({ ...actionForm, dueDate: e.target.value })} style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>メモ</div>
              <textarea value={actionForm.notes} onChange={e => setActionForm({ ...actionForm, notes: e.target.value })} placeholder="連絡内容や補足など" style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setActionModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={handleSaveAction} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>保存</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'linear-gradient(120deg, #1a1a2e 0%, #2d2b55 45%, #4f46e5 100%)', color: 'white', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(79,70,229,0.25)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '80px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <span onClick={() => router.push('/reservations')} style={{ cursor: 'pointer', fontSize: '20px' }}>←</span>
          <div><div style={{ fontSize: '19px', fontWeight: 'bold' }}>👤 顧客台帳</div><div style={{ fontSize: '12px', opacity: 0.75 }}>登録顧客: {customers.length}名 ・ {bt.icon} {bt.label}</div></div>
        </div>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <button onClick={() => { setViewMode(viewMode === 'monthly' ? 'list' : 'monthly'); setSelectedMonth(null); }} style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: viewMode === 'monthly' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>📅 月別</button>
          <button onClick={() => router.push('/customer-register')} style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>＋ 新規登録</button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {dynamicCategories.map(cat => (
            <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setActiveItem(null); setSelectedMonth(null); }} style={{ padding: '10px 18px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', background: activeCategory === cat.key ? cat.gradient : 'white', color: activeCategory === cat.key ? 'white' : '#555', boxShadow: activeCategory === cat.key ? `0 6px 16px ${cat.color}45` : '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}>{cat.icon} {cat.label} ({getCategoryCount(cat.key)})</button>
          ))}
        </div>

        {activeCategory !== 'all' && savedCategories.length > 0 && (() => {
          const cat = savedCategories.find(c => c.category === activeCategory);
          if (!cat || !cat.items || cat.items.length === 0) return null;
          return (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => setActiveItem(null)} style={{ padding: '8px 14px', borderRadius: '10px', border: activeItem === null ? 'none' : '2px solid #e5e7eb', background: activeItem === null ? activeCatInfo.color : 'white', color: activeItem === null ? 'white' : '#555', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>すべての{activeCategory}</button>
              {cat.items.map((item: any) => {
                const itemCount = customers.filter(c => { const hist = histories[c.id] || []; return hist.some(h => h.work_type === item.title); }).length;
                return (<button key={item.title} onClick={() => setActiveItem(activeItem === item.title ? null : item.title)} style={{ padding: '8px 14px', borderRadius: '10px', border: activeItem === item.title ? 'none' : '2px solid #e5e7eb', background: activeItem === item.title ? (item.borderColor || activeCatInfo.color) : 'white', color: activeItem === item.title ? 'white' : '#555', cursor: 'pointer', fontSize: '12px', fontWeight: activeItem === item.title ? 'bold' : 'normal' }}>{item.title}（{itemCount}）</button>);
              })}
            </div>
          );
        })()}

        {(activeCategory === 'all' || savedCategories.length === 0) && <div style={{ marginBottom: '8px' }} />}

        {viewMode === 'monthly' && selectedMonth === null && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <button onClick={() => setSelectedYear(y => y - 1)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', fontSize: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>◀</button>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', fontFamily: 'Georgia, serif', letterSpacing: '3px' }}>{selectedYear}年</div>
              <button onClick={() => setSelectedYear(y => y + 1)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', fontSize: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>▶</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {MONTHS.map((month, idx) => { const count = getMonthCount(idx); const isCurrentMonth = new Date().getFullYear() === selectedYear && new Date().getMonth() === idx; return (
                <div key={idx} onClick={() => setSelectedMonth(idx)} style={{ background: 'white', borderRadius: '18px', padding: '20px', cursor: 'pointer', boxShadow: isCurrentMonth ? `0 8px 24px ${activeCatInfo.color}35` : '0 2px 10px rgba(0,0,0,0.05)', border: isCurrentMonth ? `3px solid ${activeCatInfo.color}` : '2px solid #eef0f5', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: count > 0 ? `${activeCatInfo.color}12` : 'transparent' }} />
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: isCurrentMonth ? activeCatInfo.color : '#1a1a2e', marginBottom: '8px', fontFamily: 'Georgia, serif' }}>{month}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ fontSize: '28px', fontWeight: 'bold', color: count > 0 ? activeCatInfo.color : '#d0d0d0' }}>{count}</div><div style={{ fontSize: '11px', color: '#999' }}>件</div></div>
                  {count > 0 && <div style={{ marginTop: '8px', height: '4px', borderRadius: '2px', background: '#f0f0f0' }}><div style={{ height: '100%', borderRadius: '2px', background: activeCatInfo.gradient, width: `${Math.min(count * 10, 100)}%` }} /></div>}
                </div>); })}
            </div>
          </>
        )}

        {viewMode === 'monthly' && selectedMonth !== null && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => setSelectedMonth(null)} style={{ padding: '8px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '13px' }}>← 月一覧に戻る</button>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a2e', fontFamily: 'Georgia, serif' }}>{selectedYear}年 {MONTHS[selectedMonth]}</div>
              <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: activeCatInfo.gradient, color: 'white' }}>{getMonthCustomers(selectedMonth).length}名</div>
            </div>
            {getMonthCustomers(selectedMonth).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '18px' }}><div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div><div style={{ color: '#999', fontSize: '14px' }}>この月の作業履歴はありません</div></div>
            ) : (getMonthCustomers(selectedMonth).map(({ customer }) => renderCustomerCard(customer)))}
          </>
        )}

        {viewMode === 'list' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={() => setDateMode('registered')} style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', background: dateMode === 'registered' ? '#6366f1' : 'white', color: dateMode === 'registered' ? 'white' : '#555', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>📅 登録日</button>
              <button onClick={() => setDateMode('lastVisit')} style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', background: dateMode === 'lastVisit' ? '#10b981' : 'white', color: dateMode === 'lastVisit' ? 'white' : '#555', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>🔧 最終来店日</button>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={isCar ? "🔍 名前・電話番号・車種・ナンバーで検索..." : "🔍 名前・電話番号で検索..."}
              style={{ width: '100%', padding: '14px 18px', border: `2px solid ${searchFocused ? '#6366f1' : '#e5e7eb'}`, borderRadius: '14px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '20px', outline: 'none', boxShadow: searchFocused ? '0 0 0 4px rgba(99,102,241,0.12)' : 'none', transition: 'all 0.2s', background: 'white' }}
            />
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '18px' }}><div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div><div style={{ color: '#999', fontSize: '14px' }}>{searchQuery ? '検索結果がありません' : '顧客が登録されていません'}</div></div>
            ) : (filtered.map(customer => renderCustomerCard(customer)))}
          </>
        )}
      </div>
    </div>
  );
}
