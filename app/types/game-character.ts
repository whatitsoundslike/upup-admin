export interface RankCharacter {
    id?: string;
    name?: string;
    level?: number;
    power?: number;
    rarity?: string;
    element?: string;
    [key: string]: unknown;
}

export interface GameCharacter {
    id: string;
    memberId: string;
    uid: string;
    rankScore: number;
    rankCharacterId: string | null;
    rankCharacter: RankCharacter | null;
    tester: boolean;
    updatedAt: string;
}
