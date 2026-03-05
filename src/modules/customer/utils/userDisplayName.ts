type GenericUser = {
  displayName?: string | null;
  name?: string | null;
  fullName?: string | null;
  email?: string | null;
  profile?: {
    name?: string | null;
  } | null;
};

function normalizeCandidate(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function getUserDisplayName(user: GenericUser | null | undefined): string | null {
  if (!user) return null;

  const displayName = normalizeCandidate(user.displayName);
  if (displayName) return displayName;

  const name = normalizeCandidate(user.name);
  if (name) return name;

  const fullName = normalizeCandidate(user.fullName);
  if (fullName) return fullName;

  const profileName = normalizeCandidate(user.profile?.name);
  if (profileName) return profileName;

  const email = normalizeCandidate(user.email);
  if (!email) return null;

  const [localPart] = email.split('@');
  return normalizeCandidate(localPart);
}

