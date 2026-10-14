"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';

const CAR_NUMBER_AREAS = [
  "品川", "足立", "練馬", "多摩", "八王子", "横浜", "川崎", "相模",
  "大宮", "所沢", "春日部", "熊谷", "川越", "千葉", "習志野", "成田",
  "柏", "野田", "市川", "船橋", "なにわ", "大阪", "和泉", "堺",
  "神戸", "姫路", "名古屋", "三河", "岡崎", "一宮", "春日井",
  "札幌", "函館", "旭川", "室蘭", "釧路", "帯広", "北見", "苫小牧",
  "仙台", "宮城", "福島", "郡山", "いわき", "山形", "秋田", "青森",
  "弘前", "八戸", "盛岡", "水戸", "土浦", "宇都宮", "那須", "群馬",
  "高崎", "前橋", "長野", "松本", "新潟", "長岡", "富山", "石川",
  "金沢", "福井", "静岡", "浜松", "沼津", "三重", "四日市", "岐阜",
  "滋賀", "京都", "奈良", "和歌山", "鳥取", "島根", "岡山", "倉敷",
  "広島", "福山", "山口", "下関", "徳島", "香川", "高知", "松山",
  "福岡", "北九州", "久留米", "佐賀", "長崎", "佐世保", "熊本",
  "大分", "宮崎", "鹿児島", "沖縄"
];

export default function CustomerRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [postalLoading, setPostalLoading] = useState(false);
  const [carNumberArea, setCarNumberArea] = useState('');
  const [carNumberMid, setCarNumberMid] = useState('');
  const [carNumberKana, setCarNumberKana] = useState('');
  const [carNumberEnd, setCarNumberEnd] = useState('');
  const [areaCounts, setAreaCounts] = useState<{[key: string]: number}>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    carModel: '',
    carType: '',
    firstYear: '',
    address: '',
    inspectionDate: '',
    notes: '',
    workType: '',
    workDate: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editParam = params.get('edit');

    if (editParam) {
      setEditId(editParam);
      const loadCustomer = async () => {
        const { data } = await supabase.from('customers').select('*').eq('id', editParam).single();
        if (data) {
          setForm(prev => ({
            ...prev,
            name: data.name || '',
            phone: data.phone || '',
            carModel: data.car_model || '',
            carType: data.car_type || '',
            firstYear: data.first_year || '',
            address: data.address || '',
            inspectionDate: data.inspection_date || '',
          }));
          if (data.car_number) {
            const parts = data.car_number.split(' ');
            if (parts[0]) setCarNumberArea(parts[0]);
            if (parts[1]) setCarNumberMid(parts[1]);
            if (parts[2]) setCarNumberKana(parts[2]);
            if (parts[3]) setCarNumberEnd(parts[3]);
          }
        }
      };
      loadCustomer();
    } else {
      setForm(prev => ({
        ...prev,
        name: params.get('name') || '',
        phone: params.get('phone') || '',
        carModel: params.get('carModel') || '',
        workType: params.get('workType') || '',
        workDate: params.get('workDate') || '',
        notes: params.get('notes') || '',
      }));
    }

    const saved = localStorage.getItem('carAreaCounts');
    if (saved) setAreaCounts(JSON.parse(saved));
  }, []);

  const fetchAddress = async (code: string) => {
    const cleaned = code.replace('-', '');
    if (cleaned.length !== 7) return;
    setPostalLoading(true);
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`);
      const data = await res.json();
      if (data.results) {
        const r = data.results[0];
        setForm(prev => ({ ...prev, address: `${r.address1}${r.address2}${r.address3}` }));
      }
    } catch (e) {}
    setPostalLoading(false);
  };

  const selectArea = (area: string) => {
    setCarNumberArea(area);
    const newCounts = { ...areaCounts, [area]: (areaCounts[area] || 0) + 1 };
    setAreaCounts(newCounts);
    localStorage.setItem('carAreaCounts', JSON.stringify(newCounts));
  };

  const sortedAreas = [...CAR_NUMBER_AREAS].sort((a, b) => (areaCounts[b] || 0) - (areaCounts[a] || 0));

  const carNumber = `${carNumberArea} ${carNumberMid} ${carNumberKana} ${carNumberEnd}`.trim();

  const handleSubmit = async () => {
    if (!form.name) { alert('お客様名を入力してください'); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: customerData, error } = editId
      ? await supabase.from('customers').update({
          name: form.name, phone: form.phone, car_model: form.carModel,
          car_number: carNumber, car_type: form.carType, first_year: form.firstYear,
          address: form.address, inspection_date: form.inspectionDate,
        }).eq('id', editId).select().single()
      : await supabase.from('customers').insert({
          user_id: user.id,
          name: form.name,
          phone: form.phone,
          car_model: form.carModel,
          car_number: carNumber,
          car_type: form.carType,
          first_year: form.firstYear,
          address: form.address,
          inspection_date: form.inspectionDate,
        }).select().single();

    if (error) { alert('保存に失敗しました: ' + error.message); setLoading(false); return; }

    if (!editId && form.workType && form.workDate) {
      await supabase.from('customer_work_history').insert({
        user_id: user.id,
        customer_id: customerData.id,
        work_type: form.workType,
        work_date: form.workDate,
        notes: form.notes,
      });
    }

    setLoading(false);
    alert(editId ? `${form.name}さんの情報を更新しました！` : `${form.name}さんを顧客台帳に登録しました！`);
    router.back();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', border: '2px solid #e5e7eb',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: '700',
    color: '#374151', marginBottom: '6px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif" }}>
      
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span onClick={() => router.back()} style={{ cursor: 'pointer', fontSize: '20px' }}>←</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>👤 {editId ? '顧客編集' : '顧客登録'}</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>{editId ? '顧客情報を編集' : '顧客台帳に新規登録'}</div>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '24px auto', padding: '0 20px' }}>

        {form.workType && (
          <div style={{ background: '#f0f0ff', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '2px solid #6366f1' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#6366f1', marginBottom: '8px' }}>📋 予約から自動入力</div>
            <div style={{ fontSize: '13px', color: '#555' }}>🔧 {form.workType} ／ 📅 {form.workDate}</div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>👤 お客様情報</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>お客様名 <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="山田 太郎" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>電話番号</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="090-0000-0000" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>郵便番号</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={postalCode}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9-]/g, '');
                  setPostalCode(val);
                  if (val.replace('-', '').length === 7) fetchAddress(val);
                }}
                placeholder="123-4567"
                maxLength={8}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={() => fetchAddress(postalCode)} disabled={postalLoading} style={{ padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                {postalLoading ? '検索中...' : '住所検索'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>住所</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="郵便番号を入力すると自動入力されます" style={inputStyle} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>🚗 車両情報</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>車種</label>
              <input type="text" value={form.carModel} onChange={e => setForm({ ...form, carModel: e.target.value })} placeholder="例: トヨタ プリウス" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>型式</label>
              <input type="text" value={form.carType} onChange={e => setForm({ ...form, carType: e.target.value })} placeholder="例: ZVW30" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>初年度登録</label>
              <input type="month" value={form.firstYear} onChange={e => setForm({ ...form, firstYear: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>車検満了日</label>
              <input type="date" value={form.inspectionDate} onChange={e => setForm({ ...form, inspectionDate: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>車ナンバー</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={carNumberArea}
                onChange={e => selectArea(e.target.value)}
                style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', minWidth: '100px' }}
              >
                <option value="">地域</option>
                {sortedAreas.map(area => (
                  <option key={area} value={area}>
                    {area}{areaCounts[area] ? ` (${areaCounts[area]})` : ''}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={carNumberMid}
                onChange={e => setCarNumberMid(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="300"
                maxLength={4}
                style={{ ...inputStyle, width: '70px' }}
              />
              <input
                type="text"
                value={carNumberKana}
                onChange={e => setCarNumberKana(e.target.value.slice(0, 1))}
                placeholder="あ"
                maxLength={1}
                style={{ ...inputStyle, width: '50px', textAlign: 'center' }}
              />
              <input
                type="text"
                value={carNumberEnd}
                onChange={e => setCarNumberEnd(e.target.value.replace(/[^0-9・]/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                style={{ ...inputStyle, width: '80px' }}
              />
            </div>
            {carNumber && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f0f0ff', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', color: '#6366f1' }}>
                📋 {carNumber}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>📝 備考</div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="特記事項など" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          <button onClick={() => router.back()} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '14px' }}>キャンセル</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: '8px', border: 'none', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            {loading ? '保存中...' : editId ? '👤 更新する' : '👤 顧客台帳に登録'}
          </button>
        </div>
      </div>
    </div>
  );
}
