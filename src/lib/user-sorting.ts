type FirstNameSortableUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
};

const nameCollator = new Intl.Collator("en", {
  sensitivity: "base",
});

export function compareUsersByFirstName(
  a: FirstNameSortableUser,
  b: FirstNameSortableUser,
): number {
  return (
    nameCollator.compare(a.firstName, b.firstName) ||
    nameCollator.compare(a.lastName, b.lastName) ||
    nameCollator.compare(a.fullName, b.fullName) ||
    nameCollator.compare(a.id, b.id)
  );
}

export function sortUsersByFirstName<T extends FirstNameSortableUser>(users: readonly T[]): T[] {
  return [...users].sort(compareUsersByFirstName);
}
