export enum DependentRelationship {
  SPOUSE = 'spouse',
  CHILD = 'child',
  PARENT = 'parent',
}

export const isDependentRelationship = (v: unknown): v is DependentRelationship =>
  typeof v === 'string' && (Object.values(DependentRelationship) as string[]).includes(v);