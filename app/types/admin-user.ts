export interface AdminUser {
    id: string;
    username: string;
    name: string | null;
    permissions: string[];
    isSuper: boolean;
    createdAt: string;
    updatedAt: string;
}

// 카테고리 목록 (뉴스, 팁 등에서 사용하는 카테고리와 동일)
export const PERMISSION_CATEGORIES = [
    { value: 'tesla', label: '테슬라' },
    { value: 'baby', label: '육아' },
] as const;

export type PermissionCategory = typeof PERMISSION_CATEGORIES[number]['value'];
