export interface Tip {
  id: string;
  category: string;
  title: string;
  summary: string | null;
  keyword: string[] | null;
  content: string;
  thumbnail: string | null;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  updatedAt: string;
}

// 기본 카테고리 목록
export const TIP_CATEGORIES = [
  { value: 'tesla', label: '테슬라' },
  { value: 'baby', label: '육아' },
] as const;

export type TipCategory = typeof TIP_CATEGORIES[number]['value'];

