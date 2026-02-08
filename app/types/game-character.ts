export interface RankCharacter {
    name: string;
    level: number;
    className: string | null;
    element: string | null;
    imageUrl: string | null;
    stats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
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

