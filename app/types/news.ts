export interface News {
  id: string;
  category: string;
  source: string;
  title: string;
  link: string;
  thumbnail: string;
  description: string;
  published_at: string;
  likeCount: number;
  dislikeCount: number;
}

export const NEWS_CATEGORIES = [
  { value: 'tesla', label: '테슬라' },
  { value: 'baby', label: '육아' },
] as const;

export type NewsCategory = typeof NEWS_CATEGORIES[number]['value'];
