"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase';
import { getBusinessType } from '../lib/businessTypes';

// 一括ブロックがその日に適用されるか（ダッシュボードと同じ判定）
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
const blockOverlaps = (b: any, start: number, end: number) => b.all_day || (start < b.end_time && end > b.start_time);

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    customerName: '', phone: '', carModel: '', workType: '',
    preferredDate: '', preferredTime: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  const [businessType, setBusinessType] = useState('car');
  const [workCategories, setWorkCategories] = useState<any[]>([]);
  const [selectedItemDuration, setSelectedItemDuration] = useState(60);
  const supabase = createClient();

  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopBgColor, setShopBgColor] = useState('#1a1a2e');
  const [shopImageUrl, setShopImageUrl] = useState('');
  const [shopNameSize, setShopNameSize] = useState(28);
  const [shopDescSize, setShopDescSize] = useState(14);
  const [shopImageSize, setShopImageSize] = useState(140);
  const [shopImageX, setShopImageX] = useState(50);

  const [slotStatus, setSlotStatus] = useState<{ [time: string]: 'available' | 'few' | 'full' | 'closed' }>({});
  const [slotLoading, setSlotLoading] = useState(false);
  const [ownerStartHour, setOwnerStartHour] = useState(9);
  const [ownerEndHour, setOwnerEndHour] = useState(19);
  const [dayBlocks, setDayBlocks] = useState<any[]>([]);
  const [dayClosedReason, setDayClosedReason] = useState<string | null>(null);

  const TIME_SLOTS: string[] = [];
  for (let h = ownerStartHour; h < ownerEndHour; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
  }

  // 背景グラデーション生成
  const bgGradient = `linear-gradient(135deg, ${shopBgColor} 0%, ${shopBgColor}dd 100%)`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('owner') || '';
    setOwnerId(id);
    if (!id) { setPageLoading(false); return; }

    const loadOwnerData = async () => {
      try {
        const { data: settingsData } = await supabase
          .from('user_settings').select('business_type, start_hour, end_hour, shop_name, shop_description, shop_bg_color, shop_image_url, shop_name_size, shop_desc_size, shop_image_size, shop_image_x').eq('user_id', id).maybeSingle();
        if (settingsData?.business_type) setBusinessType(settingsData.business_type);
        if (settingsData?.start_hour != null) setOwnerStartHour(settingsData.start_hour);
        if (settingsData?.end_hour != null) setOwnerEndHour(settingsData.end_hour);
        if (settingsData?.shop_name) setShopName(settingsData.shop_name);
        if (settingsData?.shop_description) setShopDescription(settingsData.shop_description);
        if (settingsData?.shop_bg_color) setShopBgColor(settingsData.shop_bg_color);
        if (settingsData?.shop_image_url) setShopImageUrl(settingsData.shop_image_url);
        if (settingsData?.shop_name_size) setShopNameSize(settingsData.shop_name_size);
        if (settingsData?.shop_desc_size) setShopDescSize(settingsData.shop_desc_size);
        if (settingsData?.shop_image_size) setShopImageSize(settingsData.shop_image_size);
        if (settingsData?.shop_image_x != null) setShopImageX(settingsData.shop_image_x);

        const { data: catData } = await supabase
          .from('work_categories').select('categories').eq('user_id', id).maybeSingle();
        if (catData?.categories) setWorkCategories(catData.categories);
      } catch (e) {}
      setPageLoading(false);
    };
    loadOwnerData();
  }, []);

  const fetchAvailability = async (dateStr: string) => {
    setSlotLoading(true);
    try {
      const { data: settingsData } = await supabase.from('user_settings').select('booking_slots').eq('user_id', ownerId).maybeSingle();
      const maxSlots = settingsData?.booking_slots || 2;
      const { data: appData } = await supabase.from('appointments').select('start_time, end_time').eq('user_id', ownerId).eq('date', dateStr);

      // 一括ブロック（休業日・休憩など）
      const { data: blockData } = await supabase.from('blocked_slots').select('*').eq('user_id', ownerId);
      const blocks = (blockData || []).filter((b: any) => blockAppliesOn(b, dateStr));
      setDayBlocks(blocks);
      const shopBlocks = blocks.filter((b: any) => !b.staff_name);   // お店全体
      const staffBlocks = blocks.filter((b: any) => b.staff_name);   // 特定スタッフのみ
      const closedAllDay = shopBlocks.find((b: any) => b.all_day);
      setDayClosedReason(closedAllDay ? (closedAllDay.reason || '休業') : null);

      const newStatus: { [time: string]: 'available' | 'few' | 'full' | 'closed' } = {};
      for (const slot of TIME_SLOTS) {
        const [h, m] = slot.split(':').map(Number);
        const slotStart = h * 60 + m;
        const slotEnd = slotStart + 30;
        const workEnd = slotStart + selectedItemDuration;
        // お店全体のブロックに作業時間がかかる場合は受付不可
        if (shopBlocks.some((b: any) => blockOverlaps(b, slotStart, workEnd))) { newStatus[slot] = 'closed'; continue; }
        const overlapping = (appData || []).filter((a: any) => slotStart < a.end_time && slotEnd > a.start_time).length
          + staffBlocks.filter((b: any) => blockOverlaps(b, slotStart, slotEnd)).length;
        if (overlapping >= maxSlots) newStatus[slot] = 'full';
        else if (overlapping >= maxSlots - 1 && maxSlots > 1) newStatus[slot] = 'few';
        else newStatus[slot] = 'available';
      }
      setSlotStatus(newStatus);
    } catch (e) {}
    setSlotLoading(false);
  };

  const bizInfo = getBusinessType(businessType);
  const getExtraFieldLabel = () => {
    if (businessType === 'car') return { label: '車種', placeholder: '例: トヨタ プリウス', icon: '🚗' };
    if (businessType === 'pet') return { label: 'ペットの種類', placeholder: '例: トイプードル', icon: '🐶' };
    if (businessType === 'salon') return { label: '希望メニュー', placeholder: '例: カット＋カラー', icon: '💇' };
    return { label: 'その他', placeholder: '', icon: '📋' };
  };
  const extraField = getExtraFieldLabel();
  const displayName = shopName || bizInfo.label;
  const displayDesc = shopDescription || 'オンライン予約';

  const handleSubmit = async () => {
    if (!form.customerName || !form.phone || !form.workType || !form.preferredDate || !form.preferredTime) {
      alert('必須項目をすべて入力してください'); return;
    }
    setLoading(true);
    const { error } = await supabase.from('customer_reservations').insert({
      owner_id: ownerId, customer_name: form.customerName, phone: form.phone,
      car_model: form.carModel, work_type: form.workType,
      preferred_date: form.preferredDate, preferred_time: form.preferredTime,
      notes: form.notes, is_web: true, status: 'confirmed',
    });
    if (error) { setLoading(false); alert('送信に失敗しました。エラー: ' + error.message); return; }
    try {
      const [hour, minute] = form.preferredTime.split(':').map(Number);
      const startMins = hour * 60 + minute;
      const endMins = startMins + selectedItemDuration;
      const { data: attData } = await supabase.from('staff_attendance').select('staff_name').eq('user_id', ownerId).eq('date', form.preferredDate);
      const { data: slotsData } = await supabase.from('user_settings').select('booking_slots').eq('user_id', ownerId).maybeSingle();
      const maxSlots = slotsData?.booking_slots || 2;
      const { data: appData } = await supabase.from('appointments').select('staff, start_time, end_time').eq('user_id', ownerId).eq('date', form.preferredDate);
      const attending = (attData || []).map((a: any) => a.staff_name);
      const remainingSlots = Math.max(0, maxSlots - attending.length);
      const candidates = [...attending];
      for (let i = 1; i <= remainingSlots; i++) candidates.push(`予約枠${i}`);
      let assignedStaff = candidates[0] || '予約枠1';
      for (const candidate of candidates) {
        const hasConflict = (appData || []).some((a: any) => a.staff === candidate && startMins < a.end_time && endMins > a.start_time)
          || dayBlocks.some((b: any) => b.staff_name === candidate && blockOverlaps(b, startMins, endMins));
        if (!hasConflict) { assignedStaff = candidate; break; }
      }
      await supabase.from('appointments').insert({
        id: Date.now(), user_id: ownerId, staff: assignedStaff,
        title: form.workType, date: form.preferredDate,
        start_time: startMins, end_time: endMins,
        customer_name: form.customerName, car_model: form.carModel,
        notes: form.notes || '', is_web: true,
      });
    } catch (e) {}
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '12px' }}>予約を受け付けました！</h2>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.8', marginBottom: '24px' }}>ご予約ありがとうございます。<br />確認後、担当者よりご連絡いたします。</p>
          <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '16px', textAlign: 'left', fontSize: '13px', color: '#555' }}>
            <div style={{ marginBottom: '8px' }}>👤 {form.customerName}</div>
            <div style={{ marginBottom: '8px' }}>📞 {form.phone}</div>
            {form.carModel && <div style={{ marginBottom: '8px' }}>{extraField.icon} {form.carModel}</div>}
            <div style={{ marginBottom: '8px' }}>🔧 {form.workType}</div>
            <div>📅 {form.preferredDate} {form.preferredTime}</div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>{displayName}</div>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb',
    borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit', color: '#333',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px',
  };

  if (pageLoading) {
    return (
      <div style={{ minHeight: '100vh', background: bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!ownerId) {
    return (
      <div style={{ minHeight: '100vh', background: bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: 'center', color: 'white', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>予約ページが見つかりません</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>URLが正しいかご確認ください</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bgGradient, padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ヘッダー：店舗名＋画像 */}
      <div style={{ textAlign: 'center', marginBottom: '24px', color: 'white' }}>
        {shopImageUrl && (
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            <img src={shopImageUrl} alt={displayName} style={{ width: `${shopImageSize}px`, objectFit: 'contain', borderRadius: '12px', marginLeft: `${shopImageX}%`, transform: `translateX(-${shopImageX}%)` }} />
          </div>
        )}
        <div style={{ fontSize: `${shopNameSize}px`, fontWeight: 'bold', letterSpacing: '2px', whiteSpace: 'pre-line' }}>{displayName}</div>
        <div style={{ fontSize: `${shopDescSize}px`, opacity: 0.7, marginTop: '6px', whiteSpace: 'pre-line' }}>{displayDesc}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step >= s ? '#6366f1' : 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>{s}</div>
            {s < 3 && <div style={{ width: '30px', height: '2px', background: step > s ? '#6366f1' : 'rgba(255,255,255,0.2)' }} />}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {step === 1 && (<>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '6px' }}>お客様情報</h2>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>お名前と連絡先を入力してください</p>
          <div style={{ marginBottom: '20px' }}><label style={labelStyle}>お名前 <span style={{ color: '#ef4444' }}>*</span></label><input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="山田 太郎" style={inputStyle} /></div>
          <div style={{ marginBottom: '20px' }}><label style={labelStyle}>電話番号 <span style={{ color: '#ef4444' }}>*</span></label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="090-0000-0000" style={inputStyle} /></div>
          <div style={{ marginBottom: '28px' }}><label style={labelStyle}>{extraField.icon} {extraField.label}</label><input type="text" value={form.carModel} onChange={e => setForm({ ...form, carModel: e.target.value })} placeholder={extraField.placeholder} style={inputStyle} /></div>
          <button onClick={() => { if (!form.customerName || !form.phone) { alert('お名前と電話番号を入力してください'); return; } setStep(2); }} style={{ width: '100%', padding: '16px', background: bgGradient, color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>次へ →</button>
        </>)}

        {step === 2 && (<>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '6px' }}>作業内容</h2>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>ご希望の作業を選択してください</p>
          {workCategories.length > 0 ? (
            <div style={{ marginBottom: '28px' }}>
              {workCategories.map((cat: any) => (
                <div key={cat.category} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: cat.borderColor || '#333', marginBottom: '8px', padding: '6px 10px', background: `${cat.borderColor || '#6366f1'}10`, borderRadius: '6px', display: 'inline-block' }}>{cat.category}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {cat.items?.map((item: any) => (
                      <div key={item.title} onClick={() => { setForm({ ...form, workType: item.title }); setSelectedItemDuration(item.duration || 60); }} style={{ padding: '12px 8px', border: `2px solid ${form.workType === item.title ? (item.borderColor || '#6366f1') : '#e5e7eb'}`, borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: form.workType === item.title ? `${item.color || '#f0f0ff'}` : 'white', color: form.workType === item.title ? (item.borderColor || '#6366f1') : '#555' }}>{item.title}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontSize: '13px', marginBottom: '28px' }}>作業項目が設定されていません。<br />お電話でお問い合わせください。</div>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: '16px', background: 'white', color: '#555', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>← 戻る</button>
            <button onClick={() => { if (!form.workType) { alert('作業内容を選択してください'); return; } setStep(3); if (form.preferredDate) fetchAvailability(form.preferredDate); }} style={{ flex: 2, padding: '16px', background: bgGradient, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>次へ →</button>
          </div>
        </>)}

        {step === 3 && (<>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '6px' }}>希望日時</h2>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>ご希望の日時を選択してください</p>
          <div style={{ marginBottom: '20px' }}><label style={labelStyle}>希望日 <span style={{ color: '#ef4444' }}>*</span></label><input type="date" value={form.preferredDate} onChange={e => { setForm({ ...form, preferredDate: e.target.value, preferredTime: '' }); if (e.target.value) fetchAvailability(e.target.value); }} min={new Date().toLocaleDateString('sv-SE')} style={inputStyle} /></div>
          {form.preferredDate && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>希望時間 <span style={{ color: '#ef4444' }}>*</span></label>
              {slotLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '13px' }}>空き状況を確認中...</div>
              ) : dayClosedReason ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f3f4f6', border: '2px solid #e5e7eb', borderRadius: '12px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>🚫</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#374151' }}>この日は{dayClosedReason}です</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>お手数ですが、別の日をお選びください</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {TIME_SLOTS.map(slot => {
                      const status = slotStatus[slot] || 'available';
                      const isSelected = form.preferredTime === slot;
                      const isClosed = status === 'closed';
                      const isFull = status === 'full' || isClosed;
                      return (
                        <div key={slot} onClick={() => { if (!isFull) setForm({ ...form, preferredTime: slot }); }}
                          style={{ padding: '12px 4px', borderRadius: '10px', textAlign: 'center', cursor: isFull ? 'not-allowed' : 'pointer',
                            border: `2px solid ${isSelected ? '#6366f1' : isClosed ? '#e5e7eb' : isFull ? '#fecaca' : status === 'few' ? '#fed7aa' : '#e5e7eb'}`,
                            background: isSelected ? '#f0f0ff' : isClosed ? '#f3f4f6' : isFull ? '#fef2f2' : 'white', opacity: isFull ? 0.6 : 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: isSelected ? '#6366f1' : isFull ? '#999' : '#333' }}>{slot}</div>
                          <div style={{ fontSize: isClosed ? '12px' : '16px', marginTop: '2px', color: isClosed ? '#9ca3af' : undefined, fontWeight: isClosed ? 'bold' : undefined }}>{isClosed ? '休' : status === 'full' ? '×' : status === 'few' ? '△' : '○'}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '11px', color: '#888', justifyContent: 'center', flexWrap: 'wrap' }}><span>○ 空きあり</span><span>△ 残りわずか</span><span>× 満席</span><span>休 受付不可</span></div>
                </>
              )}
            </div>
          )}
          <div style={{ marginBottom: '28px' }}><label style={labelStyle}>備考（任意）</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ご要望や気になる点があればご記入ください" style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} /></div>
          {form.preferredTime && (
            <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '13px', color: '#555' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>📋 予約内容確認</div>
              <div style={{ marginBottom: '4px' }}>👤 {form.customerName}</div>
              <div style={{ marginBottom: '4px' }}>📞 {form.phone}</div>
              {form.carModel && <div style={{ marginBottom: '4px' }}>{extraField.icon} {form.carModel}</div>}
              <div style={{ marginBottom: '4px' }}>🔧 {form.workType}</div>
              <div>📅 {form.preferredDate} {form.preferredTime}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, padding: '16px', background: 'white', color: '#555', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>← 戻る</button>
            <button onClick={handleSubmit} disabled={loading || !form.preferredTime} style={{ flex: 2, padding: '16px', background: (loading || !form.preferredTime) ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: (loading || !form.preferredTime) ? 'not-allowed' : 'pointer' }}>{loading ? '送信中...' : '予約を送信 ✓'}</button>
          </div>
        </>)}
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Powered by As-Works</div>
    </div>
  );
}
