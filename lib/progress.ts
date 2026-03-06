import { LearnerProfile, DEFAULT_SKILLS } from './types';

const STORAGE_KEY = 'claude-learn-profile';

export function getDefaultProfile(): LearnerProfile {
  return {
    role: null,
    experienceLevel: null,
    skills: { ...DEFAULT_SKILLS },
    completedModules: [],
    moduleProgress: {},
    learningPath: [],
    assessmentComplete: false,
    streakDays: 0,
    lastActiveDate: '',
  };
}

export function loadProfile(): LearnerProfile {
  if (typeof window === 'undefined') return getDefaultProfile();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultProfile();
    const profile = JSON.parse(stored) as LearnerProfile;

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastActiveDate) {
      const lastActive = new Date(profile.lastActiveDate);
      const now = new Date(today);
      const diffDays = Math.floor(
        (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        profile.streakDays += 1;
      } else if (diffDays > 1) {
        profile.streakDays = 1;
      }
    } else {
      profile.streakDays = 1;
    }
    profile.lastActiveDate = today;
    saveProfile(profile);

    return profile;
  } catch {
    return getDefaultProfile();
  }
}

export function saveProfile(profile: LearnerProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function resetProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
