export interface Member {
    id: string;
    uid: string;
    name: string | null;
    email: string | null;
    password: string;
    createdAt: string;
    updatedAt: string;
}

export interface MemberFormData {
    uid: string;
    name?: string;
    email?: string;
    password: string;
}
