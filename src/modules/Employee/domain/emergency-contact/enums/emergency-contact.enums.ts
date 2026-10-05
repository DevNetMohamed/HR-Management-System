export enum Relationship {
  SPOUSE = 'spouse',
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  RELATIVE = 'relative',
  FRIEND = 'friend',
  OTHER = 'other',
}


export const isRelationship = (v: unknown): v is Relationship =>
  typeof v === 'string' && (Object.values(Relationship) as string[]).includes(v);
