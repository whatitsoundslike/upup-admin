export interface CommunityPost {
  id: string;
  category: string;
  source: string;
  title: string;
  content: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  hotScore: number;
  imageUrl: string;
  publishedAt: string;
  crawledAt: string;
  aiVerified: boolean;
  isActive: boolean;
}

export const COMMUNITY_SOURCES = [
  { value: 'dcinside', label: 'DC인사이드', color: '#3B4890' },
  { value: 'fmkorea', label: '에펨코리아', color: '#3578E5' },
  { value: 'clien', label: '클리앙', color: '#4BAE4F' },
  { value: 'ppomppu', label: '뽐뿌', color: '#FF6B35' },
  { value: 'ruliweb', label: '루리웹', color: '#00A2E0' },
] as const;

// DC인사이드 카테고리별 갤러리 매핑
export const DC_GALLERY_MAP: Record<string, { id: string; name: string }[]> = {
  tesla: [
    { id: 'tesla', name: '테슬라' },
  ],
  baby: [
    { id: 'mom', name: '맘' },
  ],
  ai: [
    { id: 'chatgpt', name: 'ChatGPT' },
    { id: 'programming', name: '프로그래밍' },
  ],
  desk: [
    { id: 'keyboard', name: '키보드' },
    { id: 'computer', name: '컴퓨터' },
  ],
};
