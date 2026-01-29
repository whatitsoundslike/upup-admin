export interface Tip {
  id: string;
  category: string;
  title: string;
  content: string;
  thumbnail?: string;
  created_at: string;
}

// 기본 카테고리 목록
export const TIP_CATEGORIES = [
  { value: 'tesla', label: '테슬라' },
  { value: 'baby', label: '육아' },
] as const;

export type TipCategory = typeof TIP_CATEGORIES[number]['value'];
