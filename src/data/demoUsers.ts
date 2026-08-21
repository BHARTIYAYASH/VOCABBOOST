export interface DemoUser {
  name: string;
  avatar: string;
  xp: number;
  streak: number;
}

/** Seeded "thriving community" dataset shown in Demo Mode. */
export const DEMO_USERS: DemoUser[] = [
  { name: "Priya S.", avatar: "🐯", xp: 8420, streak: 64 },
  { name: "Kenji T.", avatar: "🐼", xp: 7910, streak: 41 },
  { name: "Maria G.", avatar: "🦊", xp: 7355, streak: 89 },
  { name: "Amara O.", avatar: "🦁", xp: 6980, streak: 23 },
  { name: "Diego R.", avatar: "🐨", xp: 6410, streak: 12 },
  { name: "Yuki N.", avatar: "🐧", xp: 5825, streak: 37 },
  { name: "Lucas M.", avatar: "🐸", xp: 5240, streak: 9 },
  { name: "Fatima K.", avatar: "🦚", xp: 4870, streak: 51 },
  { name: "Arjun V.", avatar: "🐘", xp: 4310, streak: 18 },
  { name: "Chen W.", avatar: "🐲", xp: 3985, streak: 29 },
  { name: "Sofia L.", avatar: "🦋", xp: 3420, streak: 7 },
  { name: "Omar H.", avatar: "🦂", xp: 2875, streak: 14 },
];

export function demoLeaderboard(myName: string, myXp: number) {
  return [
    ...DEMO_USERS.map((u) => ({ name: u.name, avatar: u.avatar, xp: u.xp })),
    { name: myName || "You", avatar: "🦉", xp: myXp, isMe: true },
  ].sort((a, b) => b.xp - a.xp);
}
