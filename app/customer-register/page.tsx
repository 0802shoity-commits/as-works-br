"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';
import { getBusinessType } from '../lib/businessTypes';
import { CAR_MAKERS, CarMaker } from '../lib/carMakers';

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
  const [originalName, setOriginalName] = useState('');
  const [businessType, setBusinessType] = useState('car');
  const [customFields, setCustomFields] = useState<{ [key: string]: string }>({});
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [matchedCustomers, setMatchedCustomers] = useState<any[]>([]);
  const [savedCategories, setSavedCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  // メーカー・車種選択
  const [selectedMaker, setSelectedMaker] = useState<string>('');
  const [showMakerList, setShowMakerList] = useState(false);
  const [makerSearch, setMakerSearch] = useState('');
  const [showModelList, setShowModelList] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    furiganaLast: '',
    furiganaFirst: '',
    phone1: '',
    phone2: '',
    phone3: '',
    carModel: '',
    carType: '',
    firstYear: '',
    address: '',
    inspectionDate: '',
    notes: '',
    workType: '',
    workDate: '',
  });

  const fullName = `${form.lastName} ${form.firstName}`.trim();
  const fullPhone = [form.phone1, form.phone2, form.phone3].filter(Boolean).join('-');
  const fullFurigana = `${form.furiganaLast} ${form.furiganaFirst}`.trim();
  const phoneDigits = fullPhone.replace(/[-\s]/g, '');

  useEffect(() => {
    const loadBusinessType = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('user_settings').select('business_type').eq('user_id', user.id).single();
      if (data?.business_type) setBusinessType(data.business_type);
      const { data: custData } = await supabase.from('customers').select('id, name, phone, car_model, car_number').eq('user_id', user.id);
      if (custData) setAllCustomers(custData);
      const { data: catData } = await supabase.from('work_categories').select('categories').eq('user_id', user.id).single();
      if (catData?.categories) setSavedCategories(catData.categories);
    };
    loadBusinessType();

    const params = new URLSearchParams(window.location.search);
    const editParam = params.get('edit');

    if (editParam) {
      setEditId(editParam);
      const loadCustomer = async () => {
        const { data } = await supabase.from('customers').select('*').eq('id', editParam).single();
        if (data) {
          setOriginalName(data.name || '');
          const nameParts = (data.name || '').split(' ');
          const phoneParts = (data.phone || '').split('-');
          const cf = data.custom_fields || {};
          // car_modelから メーカー/車種 を分解
          const carModelStr = data.car_model || '';
          const slashIdx = carModelStr.indexOf('/');
          if (slashIdx > 0) {
            const maker = carModelStr.substring(0, slashIdx).trim();
            const model = carModelStr.substring(slashIdx + 1).trim();
            setSelectedMaker(maker);
            setForm(prev => ({ ...prev, carModel: model }));
          } else if (carModelStr.includes(' ')) {
            const spaceIdx = carModelStr.indexOf(' ');
            const maker = carModelStr.substring(0, spaceIdx).trim();
            const model = carModelStr.substring(spaceIdx + 1).trim();
            // Check if it matches a known maker
            if (CAR_MAKERS.some((m: CarMaker) => m.name === maker)) {
              setSelectedMaker(maker);
              setForm(prev => ({ ...prev, carModel: model }));
            } else {
              setForm(prev => ({ ...prev, carModel: carModelStr }));
            }
          } else {
            setForm(prev => ({ ...prev, carModel: carModelStr }));
          }
          setForm(prev => ({
            ...prev,
            lastName: nameParts[0] || '',
            firstName: nameParts.slice(1).join(' ') || '',
            furiganaLast: cf.furiganaLast || '',
            furiganaFirst: cf.furiganaFirst || '',
            phone1: phoneParts[0] || '',
            phone2: phoneParts[1] || '',
            phone3: phoneParts[2] || '',
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
          if (data.custom_fields) {
            const { furiganaLast, furiganaFirst, ...rest } = data.custom_fields;
            setCustomFields(rest);
          }
        }
      };
      loadCustomer();
    } else {
      const pName = params.get('name') || '';
      const pNameParts = pName.split(' ');
      const pPhone = params.get('phone') || '';
      const pPhoneParts = pPhone.split('-');
      setForm(prev => ({
        ...prev,
        lastName: pNameParts[0] || '',
        firstName: pNameParts.slice(1).join(' ') || '',
        phone1: pPhoneParts[0] || '',
        phone2: pPhoneParts[1] || '',
        phone3: pPhoneParts[2] || '',
        carModel: params.get('carModel') || '',
        workType: params.get('workType') || '',
        workDate: params.get('workDate') || '',
        notes: params.get('notes') || '',
      }));
    }

    const saved = localStorage.getItem('carAreaCounts');
    if (saved) setAreaCounts(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (editId) { setMatchedCustomers([]); return; }
    const name = fullName.toLowerCase();
    const digits = phoneDigits;
    if (name.length < 2 || digits.length < 4) { setMatchedCustomers([]); return; }
    const matches = allCustomers.filter(c => {
      const nameMatch = c.name?.toLowerCase().includes(name);
      const cDigits = (c.phone || '').replace(/[-\s]/g, '');
      const phoneMatch = cDigits.includes(digits) || digits.includes(cDigits);
      return nameMatch && phoneMatch;
    });
    setMatchedCustomers(matches.slice(0, 5));
  }, [form.lastName, form.firstName, form.phone1, form.phone2, form.phone3, allCustomers, editId]);

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

  // メーカー/車種を結合して保存用の値を作る
  const getCarModelForSave = () => {
    if (selectedMaker && form.carModel) return `${selectedMaker}/${form.carModel}`;
    if (selectedMaker) return selectedMaker;
    return form.carModel;
  };

  const handleSubmit = async () => {
    if (!form.lastName) { alert('苗字を入力してください'); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const allCustomFields = { ...customFields, furiganaLast: form.furiganaLast, furiganaFirst: form.furiganaFirst };
    const carModelValue = getCarModelForSave();

    const { data: customerData, error } = editId
      ? await supabase.from('customers').update({
          name: fullName, phone: fullPhone, car_model: carModelValue,
          car_number: carNumber, car_type: form.carType, first_year: form.firstYear,
          address: form.address, inspection_date: form.inspectionDate,
          custom_fields: allCustomFields,
        }).eq('id', editId).select().single()
      : await supabase.from('customers').insert({
          user_id: user.id, name: fullName, phone: fullPhone,
          car_model: carModelValue, car_number: carNumber,
          car_type: form.carType, first_year: form.firstYear,
          address: form.address, inspection_date: form.inspectionDate,
          custom_fields: allCustomFields,
        }).select().single();

    if (error) { alert('保存に失敗しました: ' + error.message); setLoading(false); return; }

    if (editId && originalName && originalName !== fullName) {
      await supabase
        .from('customer_reservations')
        .update({ customer_name: fullName })
        .eq('owner_id', user.id)
        .eq('customer_name', originalName);
      await supabase
        .from('appointments')
        .update({ customer_name: fullName })
        .eq('user_id', user.id)
        .eq('customer_name', originalName);
    }
    if (!editId && form.workType && form.workDate) {
      await supabase.from('customer_work_history').insert({
        user_id: user.id, customer_id: customerData.id,
        work_type: form.workType, work_date: form.workDate, notes: form.notes,
      });
    }

    setLoading(false);
    alert(editId ? `${fullName}さんの情報を更新しました！` : `${fullName}さんを顧客台帳に登録しました！`);
    router.back();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', border: '2px solid #e5e7eb',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px',
  };

  // メーカー検索フィルタ
  const filteredMakers = makerSearch
    ? CAR_MAKERS.filter((m: CarMaker) => m.name.toLowerCase().includes(makerSearch.toLowerCase()))
    : CAR_MAKERS;

  const selectedMakerData = CAR_MAKERS.find((m: CarMaker) => m.name === selectedMaker);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: 'transparent(135deg, #1a1a2e, #0f3460)', color: '#1a1a2e', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span onClick={() => router.back()} style={{ cursor: 'pointer', fontSize: '20px' }}>←</span>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{editId ? '顧客編集' : '顧客登録'}</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>{editId ? '顧客情報を編集' : '顧客台帳に新規登録'}</div>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '24px auto', padding: '0 20px' }}>

        {form.workType && (
          <div style={{ background: '#f0f0ff', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '2px solid #6366f1' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#6366f1', marginBottom: '8px' }}>予約から自動入力</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{form.workType} ／ {form.workDate}</div>
          </div>
        )}

        {matchedCustomers.length > 0 && (
          <div style={{ background: '#fff3e0', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '2px solid #f59e0b' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e65100', marginBottom: '10px' }}>登録済みの顧客と一致する可能性があります</div>
            {matchedCustomers.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'white', borderRadius: '8px', marginBottom: '6px', border: '1px solid #fde68a' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1a1a2e' }}>{c.name}</span>
                  {c.phone && <span style={{ fontSize: '13px', color: '#666', marginLeft: '12px' }}>{c.phone}</span>}
                  {c.car_model && <span style={{ fontSize: '13px', color: '#666', marginLeft: '12px' }}>{c.car_model}</span>}
                </div>
                <button onClick={() => router.push(`/customer-register?edit=${c.id}`)} style={{ padding: '5px 12px', borderRadius: '8px', border: '2px solid #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>編集</button>
              </div>
            ))}
            <div style={{ fontSize: '11px', color: '#b45309', marginTop: '6px' }}>※ そのまま新規登録もできます（同一人物で別の車両等）</div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>お客様情報</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>苗字 <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="山田" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>名前</label>
              <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="太郎" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>フリガナ（苗字）</label>
              <input type="text" value={form.furiganaLast} onChange={e => setForm({ ...form, furiganaLast: e.target.value })} placeholder="ヤマダ" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>フリガナ（名前）</label>
              <input type="text" value={form.furiganaFirst} onChange={e => setForm({ ...form, furiganaFirst: e.target.value })} placeholder="タロウ" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>電話番号</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="tel" value={form.phone1} onChange={e => setForm({ ...form, phone1: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })} placeholder="090" maxLength={4} style={{ ...inputStyle, width: '90px', textAlign: 'center' }} />
              <span style={{ fontSize: '16px', color: '#999' }}>-</span>
              <input type="tel" value={form.phone2} onChange={e => setForm({ ...form, phone2: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })} placeholder="0000" maxLength={4} style={{ ...inputStyle, width: '90px', textAlign: 'center' }} />
              <span style={{ fontSize: '16px', color: '#999' }}>-</span>
              <input type="tel" value={form.phone3} onChange={e => setForm({ ...form, phone3: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })} placeholder="0000" maxLength={4} style={{ ...inputStyle, width: '90px', textAlign: 'center' }} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>郵便番号</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={postalCode} onChange={e => { const val = e.target.value.replace(/[^0-9-]/g, ''); setPostalCode(val); if (val.replace('-', '').length === 7) fetchAddress(val); }} placeholder="123-4567" maxLength={8} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => fetchAddress(postalCode)} disabled={postalLoading} style={{ padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{postalLoading ? '検索中...' : '住所検索'}</button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>住所</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="郵便番号を入力すると自動入力されます" style={inputStyle} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>{getBusinessType(businessType).sectionTitle}</div>

          {businessType === 'car' ? (<>
            {/* メーカー選択 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>メーカー</label>
              <div
                onClick={() => setShowMakerList(!showMakerList)}
                style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedMaker ? '#f0f4ff' : 'white', borderColor: selectedMaker ? '#6366f1' : '#e5e7eb' }}
              >
                <span style={{ color: selectedMaker ? '#1a1a2e' : '#9ca3af', fontWeight: selectedMaker ? 'bold' : 'normal' }}>
                  {selectedMaker || 'メーカーを選択'}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af', transform: showMakerList ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </div>
              {showMakerList && (
                <div style={{ marginTop: '8px', border: '2px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                  <input
                    type="text"
                    value={makerSearch}
                    onChange={e => setMakerSearch(e.target.value)}
                    placeholder="メーカー名で検索..."
                    style={{ ...inputStyle, border: 'none', borderBottom: '1px solid #f0f0f0', borderRadius: 0 }}
                    autoFocus
                  />
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredMakers.map((m: CarMaker) => (
                      <div
                        key={m.name}
                        onClick={() => { setSelectedMaker(m.name); setShowMakerList(false); setMakerSearch(''); setForm(prev => ({ ...prev, carModel: '' })); setShowModelList(false); setModelSearch(''); }}
                        style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: selectedMaker === m.name ? 'bold' : 'normal', color: selectedMaker === m.name ? '#6366f1' : '#333', background: selectedMaker === m.name ? '#f0f4ff' : 'white', borderBottom: '1px solid #f8f8f8' }}
                        onMouseEnter={e => { if (selectedMaker !== m.name) (e.currentTarget as HTMLElement).style.background = '#f8f9fa'; }}
                        onMouseLeave={e => { if (selectedMaker !== m.name) (e.currentTarget as HTMLElement).style.background = 'white'; }}
                      >
                        {m.name}
                        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>{m.models.length}車種</span>
                      </div>
                    ))}
                    <div
                      onClick={() => { setSelectedMaker(''); setShowMakerList(false); setMakerSearch(''); }}
                      style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '13px', color: '#9ca3af', borderTop: '1px solid #e5e7eb' }}
                    >
                      その他（手入力）
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 車種選択: メーカー選択済みならボタン一覧、未選択なら手入力 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>車種</label>
              {selectedMakerData ? (
                <>
                  <div
                    onClick={() => setShowModelList(!showModelList)}
                    style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: form.carModel ? '#f0f4ff' : 'white', borderColor: form.carModel ? '#6366f1' : '#e5e7eb' }}
                  >
                    <span style={{ color: form.carModel ? '#1a1a2e' : '#9ca3af', fontWeight: form.carModel ? 'bold' : 'normal' }}>
                      {form.carModel || '車種を選択'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af', transform: showModelList ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                  </div>
                  {showModelList && (
                    <div style={{ marginTop: '8px', border: '2px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={e => setModelSearch(e.target.value)}
                        placeholder="車種名で検索..."
                        style={{ ...inputStyle, border: 'none', borderBottom: '1px solid #f0f0f0', borderRadius: 0 }}
                        autoFocus
                      />
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {selectedMakerData.models
                          .filter((model: string) => !modelSearch || model.toLowerCase().includes(modelSearch.toLowerCase()))
                          .map((model: string) => (
                          <div
                            key={model}
                            onClick={() => { setForm(prev => ({ ...prev, carModel: model })); setShowModelList(false); setModelSearch(''); }}
                            style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: form.carModel === model ? 'bold' : 'normal', color: form.carModel === model ? '#6366f1' : '#333', background: form.carModel === model ? '#f0f4ff' : 'white', borderBottom: '1px solid #f8f8f8' }}
                            onMouseEnter={e => { if (form.carModel !== model) (e.currentTarget as HTMLElement).style.background = '#f8f9fa'; }}
                            onMouseLeave={e => { if (form.carModel !== model) (e.currentTarget as HTMLElement).style.background = 'white'; }}
                          >
                            {model}
                          </div>
                        ))}
                        <div
                          onClick={() => { setShowModelList(false); setModelSearch(''); }}
                          style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '13px', color: '#9ca3af', borderTop: '1px solid #e5e7eb' }}
                        >
                          その他（手入力）
                        </div>
                      </div>
                    </div>
                  )}
                  <input
                    type="text"
                    value={form.carModel}
                    onChange={e => setForm({ ...form, carModel: e.target.value })}
                    placeholder="一覧にない場合は手入力"
                    style={{ ...inputStyle, background: '#fafafa', marginTop: '8px' }}
                  />
                </>
              ) : (
                <input type="text" value={form.carModel} onChange={e => setForm({ ...form, carModel: e.target.value })} placeholder="例: プリウス" style={inputStyle} />
              )}
            </div>

            {/* 選択結果プレビュー */}
            {(selectedMaker || form.carModel) && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#f0f4ff', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', color: '#4f46e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{getCarModelForSave()}</span>
                <span onClick={() => { setSelectedMaker(''); setForm(prev => ({ ...prev, carModel: '' })); }} style={{ fontSize: '12px', color: '#9ca3af', cursor: 'pointer' }}>クリア</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div><label style={labelStyle}>型式</label><input type="text" value={form.carType} onChange={e => setForm({ ...form, carType: e.target.value })} placeholder="例: ZVW30" style={inputStyle} /></div>
              <div><label style={labelStyle}>初年度登録</label><input type="month" value={form.firstYear} onChange={e => setForm({ ...form, firstYear: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>車検満了日</label>
              <input type="date" value={form.inspectionDate} onChange={e => setForm({ ...form, inspectionDate: e.target.value })} style={inputStyle} />
            </div>
          </>) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {getBusinessType(businessType).fields.map(field => (
                <div key={field.key} style={field.type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
                  <label style={labelStyle}>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea value={customFields[field.key] || ''} onChange={e => setCustomFields({ ...customFields, [field.key]: e.target.value })} placeholder={field.placeholder} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
                  ) : (
                    <input type={field.type} value={customFields[field.key] || ''} onChange={e => setCustomFields({ ...customFields, [field.key]: e.target.value })} placeholder={field.placeholder} style={inputStyle} />
                  )}
                </div>
              ))}
            </div>
          )}
          {businessType === 'car' && (
          <div>
            <label style={labelStyle}>車ナンバー</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={carNumberArea} onChange={e => selectArea(e.target.value)} style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', minWidth: '100px' }}>
                <option value="">地域</option>
                {sortedAreas.map(area => (<option key={area} value={area}>{area}{areaCounts[area] ? ` (${areaCounts[area]})` : ''}</option>))}
              </select>
              <input type="text" value={carNumberMid} onChange={e => setCarNumberMid(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="300" maxLength={4} style={{ ...inputStyle, width: '70px' }} />
              <input type="text" value={carNumberKana} onChange={e => setCarNumberKana(e.target.value.slice(0, 1))} placeholder="あ" maxLength={1} style={{ ...inputStyle, width: '50px', textAlign: 'center' }} />
              <input type="text" value={carNumberEnd} onChange={e => setCarNumberEnd(e.target.value.replace(/[^0-9・]/g, '').slice(0, 4))} placeholder="1234" maxLength={4} style={{ ...inputStyle, width: '80px' }} />
            </div>
            {carNumber && (<div style={{ marginTop: '8px', padding: '8px 12px', background: '#f0f0ff', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', color: '#6366f1' }}>{carNumber}</div>)}
          </div>
          )}
        </div>

        {!editId && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>作業内容</div>
          
          {savedCategories.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#999', textAlign: 'center', padding: '16px' }}>作業項目がありません（ダッシュボードの「項目追加」から登録）</div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>カテゴリー</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {savedCategories.map(cat => (
                    <div key={cat.category} onClick={() => { setSelectedCategory(selectedCategory === cat.category ? '' : cat.category); if (selectedCategory !== cat.category) setForm(prev => ({ ...prev, workType: '' })); }} style={{ padding: '10px 16px', borderRadius: '10px', border: `2px solid ${selectedCategory === cat.category ? (cat.borderColor || '#6366f1') : '#e5e7eb'}`, background: selectedCategory === cat.category ? `${cat.borderColor || '#6366f1'}15` : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: selectedCategory === cat.category ? 'bold' : 'normal', color: '#333' }}>{cat.category}</div>
                  ))}
                </div>
              </div>

              {selectedCategory && (() => {
                const cat = savedCategories.find(c => c.category === selectedCategory);
                if (!cat || !(cat.items || []).length) return <div style={{ fontSize: '13px', color: '#999' }}>このカテゴリーに項目がありません</div>;
                return (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>項目</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(cat.items || []).map((item: any) => (
                        <div key={item.title} onClick={() => setForm(prev => ({ ...prev, workType: prev.workType === item.title ? '' : item.title }))} style={{ padding: '10px 16px', borderRadius: '10px', border: `2px solid ${form.workType === item.title ? (item.borderColor || '#6366f1') : '#e5e7eb'}`, background: form.workType === item.title ? (item.color || '#f0f0ff') : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: form.workType === item.title ? 'bold' : 'normal', color: '#333' }}>{item.title}</div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label style={labelStyle}>作業日</label>
                <input type="date" value={form.workDate} onChange={e => setForm({ ...form, workDate: e.target.value })} style={inputStyle} />
              </div>
            </>
          )}
        </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>備考</div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="特記事項など" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          <button onClick={() => router.back()} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '14px' }}>キャンセル</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: '8px', border: 'none', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            {loading ? '保存中...' : editId ? '更新する' : '顧客台帳に登録'}
          </button>
        </div>
      </div>
    </div>
  );
}
