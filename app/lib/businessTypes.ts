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
    label: 'Oficina mecânica',
    icon: '🚗',
    sectionTitle: '🚗 Dados do veículo',
    fields: [
      { key: 'carModel', label: 'Modelo', type: 'text', placeholder: 'Ex.: Chevrolet Onix' },
      { key: 'carType', label: 'Versão / motor', type: 'text', placeholder: 'Ex.: 1.0 Turbo' },
      { key: 'firstYear', label: 'Ano / mês de fabricação', type: 'month' },
      { key: 'inspectionDate', label: 'Vencimento do licenciamento', type: 'date' },
    ],
  },
  {
    key: 'pet',
    label: 'Pet shop',
    icon: '🐶',
    sectionTitle: '🐶 Dados do pet',
    fields: [
      { key: 'petName', label: 'Nome do pet', type: 'text', placeholder: 'Ex.: Mel' },
      { key: 'petKind', label: 'Espécie / raça', type: 'text', placeholder: 'Ex.: Poodle' },
      { key: 'petWeight', label: 'Peso', type: 'text', placeholder: 'Ex.: 3,5 kg' },
      { key: 'lastCut', label: 'Última tosa', type: 'date' },
      { key: 'vaccineDate', label: 'Data da vacina', type: 'date' },
    ],
  },
  {
    key: 'salon',
    label: 'Salão de beleza',
    icon: '💇',
    sectionTitle: '💇 Ficha da cliente',
    fields: [
      { key: 'hairType', label: 'Tipo de cabelo', type: 'text', placeholder: 'Ex.: fino, cacheado' },
      { key: 'colorHistory', label: 'Histórico de coloração', type: 'text', placeholder: 'Ex.: tons acinzentados' },
      { key: 'allergy', label: 'Alergias', type: 'text', placeholder: 'Ex.: amônia' },
      { key: 'preferStyle', label: 'Estilo preferido', type: 'textarea', placeholder: 'Corte ou estilo desejado' },
    ],
  },
  {
    key: 'other',
    label: 'Outros',
    icon: '🏢',
    sectionTitle: '📋 Dados do cliente',
    fields: [
      { key: 'itemName', label: 'Item / objeto', type: 'text', placeholder: 'Ex.: nome do produto ou objeto' },
      { key: 'detail', label: 'Detalhes', type: 'text', placeholder: 'Ex.: modelo, estado' },
      { key: 'lastDate', label: 'Último atendimento', type: 'date' },
      { key: 'memo', label: 'Notas', type: 'textarea', placeholder: 'Texto livre' },
    ],
  },
];

export const getBusinessType = (key: string): BusinessType =>
  BUSINESS_TYPES.find(b => b.key === key) || BUSINESS_TYPES[0];
