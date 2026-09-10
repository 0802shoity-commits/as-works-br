export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'date' | 'month' | 'textarea' | 'tel';
  placeholder?: string;
};

export type BusinessType = {
  key: string;
  label: string;
  icon: string;
  sectionTitle: string;
  fields: FieldDef[];
};

export const BUSINESS_TYPES: BusinessType[] = [
  {
    key: 'car',
    label: '自動車屋',
    icon: '🚗',
    sectionTitle: '🚗 車両情報',
    fields: [
      { key: 'carModel', label: '車種', type: 'text', placeholder: '例: トヨタ プリウス' },
      { key: 'carType', label: '型式', type: 'text', placeholder: '例: ZVW30' },
      { key: 'firstYear', label: '初年度登録', type: 'month' },
      { key: 'inspectionDate', label: '車検満了日', type: 'date' },
    ],
  },
  {
    key: 'pet',
    label: 'ペットサロン',
    icon: '🐶',
    sectionTitle: '🐶 ペット情報',
    fields: [
      { key: 'petName', label: 'ペットの名前', type: 'text', placeholder: '例: ココ' },
      { key: 'petKind', label: '種類・犬種', type: 'text', placeholder: '例: トイプードル' },
      { key: 'petWeight', label: '体重', type: 'text', placeholder: '例: 3.5kg' },
      { key: 'lastCut', label: '前回カット日', type: 'date' },
      { key: 'vaccineDate', label: 'ワクチン接種日', type: 'date' },
    ],
  },
  {
    key: 'salon',
    label: '美容室',
    icon: '💇',
    sectionTitle: '💇 カルテ情報',
    fields: [
      { key: 'hairType', label: '髪質', type: 'text', placeholder: '例: 軟毛・くせ毛' },
      { key: 'colorHistory', label: 'カラー履歴', type: 'text', placeholder: '例: アッシュ系' },
      { key: 'allergy', label: 'アレルギー', type: 'text', placeholder: '例: ジアミン' },
      { key: 'preferStyle', label: '好みのスタイル', type: 'textarea', placeholder: '希望のスタイルなど' },
    ],
  },
  {
    key: 'other',
    label: 'その他',
    icon: '🏢',
    sectionTitle: '📋 顧客情報',
    fields: [
      { key: 'itemName', label: '対象・品目', type: 'text', placeholder: '例: 商品名・対象物など' },
      { key: 'detail', label: '詳細', type: 'text', placeholder: '例: 型番・状態など' },
      { key: 'lastDate', label: '前回対応日', type: 'date' },
      { key: 'memo', label: 'メモ', type: 'textarea', placeholder: '自由記入' },
    ],
  },
];

export const getBusinessType = (key: string): BusinessType =>
  BUSINESS_TYPES.find(b => b.key === key) || BUSINESS_TYPES[0];