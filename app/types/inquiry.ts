export interface Inquiry {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  title: string;
  content: string;
  answer: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const INQUIRY_STATUSES = [
  { value: 'pending', label: '미답변', badgeClass: 'badge-warning' },
  { value: 'answered', label: '답변완료', badgeClass: 'badge-success' },
] as const;
