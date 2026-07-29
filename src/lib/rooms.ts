// Single source of truth for the desktop's "rooms". The Noctalia bar renders
// them as a workspace rail (numbered 1..N) and the dock renders them as apps,
// so both stay in sync from one list. `href` is base-relative (no BASE_URL).

export type RoomId = 'writing' | 'code' | 'stack' | 'me' | 'work';

export interface Room {
  id: RoomId;
  label: string;
  href: string;
  ws: number; // workspace number shown in the bar rail
}

export const ROOMS: Room[] = [
  { id: 'writing', label: 'Writing', href: '/writing', ws: 1 },
  { id: 'code', label: 'Code', href: '/code', ws: 2 },
  { id: 'stack', label: 'Stack', href: '/stack', ws: 3 },
  { id: 'me', label: 'Me', href: '/about', ws: 4 },
  { id: 'work', label: 'Work', href: '/consulting', ws: 5 },
];

// Map the first path segment to the active room. `/about` is the "Me" room and
// `/consulting` is the "Work" room; the URLs stay put so nothing indexed breaks.
export function activeFromSeg(seg: string): RoomId | undefined {
  switch (seg) {
    case 'writing':
    case 'posts':
      return 'writing';
    case 'code':
      return 'code';
    case 'stack':
      return 'stack';
    case 'about':
      return 'me';
    case 'consulting':
      return 'work';
    default:
      return undefined;
  }
}
