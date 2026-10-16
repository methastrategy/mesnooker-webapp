/**
 * Player roster utilities for Mesnooker.
 */

export interface ShuffledRoster {
  names: string[];
  avatars: string[];
}

/**
 * Shuffle the active players roster (Fisher-Yates) while preserving name-avatar bindings.
 * Guarantees a different ordering when count >= 2.
 *
 * @param names Array of player nicknames
 * @param avatars Array of player avatar emojis / image URIs
 * @param count Number of active players to shuffle
 * @param rng Random number generator (defaults to Math.random for production)
 */
export function shuffleRoster(
  names: string[],
  avatars: string[],
  count: number,
  rng: () => number = Math.random
): ShuffledRoster {
  if (count < 2) {
    return { names: [...names], avatars: [...avatars] };
  }

  const effectiveCount = Math.min(count, names.length, avatars.length);
  if (effectiveCount < 2) {
    return { names: [...names], avatars: [...avatars] };
  }

  const activeIndices = Array.from({ length: effectiveCount }, (_, i) => i);

  // For 2 players, always swap so the user receives unmistakable visual and haptic feedback
  if (effectiveCount === 2) {
    [activeIndices[0], activeIndices[1]] = [activeIndices[1], activeIndices[0]];
  } else {
    // Fisher-Yates shuffle
    for (let i = activeIndices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [activeIndices[i], activeIndices[j]] = [activeIndices[j], activeIndices[i]];
    }

    // Safeguard: If random permutation happens to equal the original order,
    // swap the first two active indices to guarantee visible queue rotation.
    const isIdentical = activeIndices.every((val, idx) => val === idx);
    if (isIdentical) {
      [activeIndices[0], activeIndices[1]] = [activeIndices[1], activeIndices[0]];
    }
  }

  const nextNames = [...names];
  const nextAvatars = [...avatars];
  const origNames = [...names];
  const origAvatars = [...avatars];

  for (let i = 0; i < effectiveCount; i++) {
    nextNames[i] = origNames[activeIndices[i]];
    nextAvatars[i] = origAvatars[activeIndices[i]];
  }

  return { names: nextNames, avatars: nextAvatars };
}
