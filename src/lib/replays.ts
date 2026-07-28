export const ROLES = ["Tank", "Damage", "Support"] as const;
export type Role = (typeof ROLES)[number];

export const RANKS = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Grandmaster",
  "Champion",
] as const;
export type Rank = (typeof RANKS)[number];

export const DIVISIONS = [5, 4, 3, 2, 1] as const;

export const RESULTS = ["Win", "Loss"] as const;
export type Result = (typeof RESULTS)[number];

export const HEROES_BY_ROLE: Record<Role, string[]> = {
  Tank: [
    "D.Va",
    "Doomfist",
    "Junker Queen",
    "Mauga",
    "Orisa",
    "Ramattra",
    "Reinhardt",
    "Roadhog",
    "Sigma",
    "Winston",
    "Wrecking Ball",
    "Zarya",
  ],
  Damage: [
    "Ashe",
    "Bastion",
    "Cassidy",
    "Echo",
    "Genji",
    "Hanzo",
    "Junkrat",
    "Mei",
    "Pharah",
    "Reaper",
    "Sojourn",
    "Soldier: 76",
    "Sombra",
    "Symmetra",
    "Torbjörn",
    "Tracer",
    "Venture",
    "Widowmaker",
  ],
  Support: [
    "Ana",
    "Baptiste",
    "Brigitte",
    "Illari",
    "Juno",
    "Kiriko",
    "Lifeweaver",
    "Lucio",
    "Mercy",
    "Moira",
    "Zenyatta",
  ],
};

export const ALL_HEROES = Object.values(HEROES_BY_ROLE).flat().sort();

export const MAPS = [
  "Antarctic Peninsula",
  "Blizzard World",
  "Busan",
  "Circuit Royal",
  "Colosseo",
  "Dorado",
  "Eichenwalde",
  "Esperança",
  "Havana",
  "Hollywood",
  "Ilios",
  "Junkertown",
  "King's Row",
  "Lijiang Tower",
  "Midtown",
  "Nepal",
  "New Junk City",
  "Numbani",
  "Oasis",
  "Paraiso",
  "Rialto",
  "Route 66",
  "Samoa",
  "Shambali Monastery",
  "Suravasa",
  "Watchpoint: Gibraltar",
];

// Learning rule from the source template: watch replays one tier above your own.
const SUGGEST: Record<Rank, Rank> = {
  Bronze: "Silver",
  Silver: "Gold",
  Gold: "Platinum",
  Platinum: "Diamond",
  Diamond: "Master",
  Master: "Grandmaster",
  Grandmaster: "Champion",
  Champion: "Champion",
};

export function suggestReplayRank(rank: Rank): Rank {
  return SUGGEST[rank];
}

export function roleColorVar(role: Role): string {
  return `var(--role-${role.toLowerCase()})`;
}

export function rankColorVar(rank: Rank): string {
  return `var(--rank-${rank.toLowerCase()})`;
}
