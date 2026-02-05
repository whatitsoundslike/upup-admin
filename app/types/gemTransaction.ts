export interface GemTransaction {
    id: string;
    memberId: string;
    type: string;
    amount: number;
    source: string;
    memo: string | null;
    createdAt: string;
}

export interface GemTransactionWithMember extends GemTransaction {
    member: {
        uid: string;
        name: string | null;
        email: string | null;
    };
}
