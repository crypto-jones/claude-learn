import { LearnerProfile, DEFAULT_SKILLS } from './types';

const STORAGE_KEY = 'claude-learn-profile';

export function getDefaultProfile(): LearnerProfile {
  return {
    role: null,
    experienceLevel: null,
    skills: { ...DEFAULT_SKILLS },
    initialSkills: null,
    completedModules: [],
    moduleProgress: {},
    learningPath: [],
    assessmentComplete: false,
    streakDays: 0,
    lastActiveDate: '',
    totalMinutesLearned: 0,
    currentSessionStart: null,
    learningGoals: [],
    reviews: [],
  };
}

export function loadProfile(): LearnerProfile {
  if (typeof window === 'undefined') return getDefaultProfile();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultProfile();
    const profile = JSON.parse(stored) as LearnerProfile;

    // Migrate old profiles that lack new fields
    if (!profile.initialSkills) profile.initialSkills = null;
    if (profile.totalMinutesLearned === undefined) profile.totalMinutesLearned = 0;
    if (profile.currentSessionStart === undefined) profile.currentSessionStart = null;
    if (!profile.learningGoals) profile.learningGoals = [];
    if (!profile.reviews) profile.reviews = [];

    // Migrate moduleProgress entries that lack exerciseFeedback
    for (const key of Object.keys(profile.moduleProgress)) {
      if (!profile.moduleProgress[key].exerciseFeedback) {
        profile.moduleProgress[key].exerciseFeedback = {};
      }
    }

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

    // Start session timer
    if (!profile.currentSessionStart) {
      profile.currentSessionStart = Date.now();
    }

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

/** Flush elapsed session time into totalMinutesLearned */
export function flushSessionTime(profile: LearnerProfile): LearnerProfile {
  if (!profile.currentSessionStart) return profile;
  const elapsed = Math.floor((Date.now() - profile.currentSessionStart) / 60000);
  return {
    ...profile,
    totalMinutesLearned: profile.totalMinutesLearned + Math.max(elapsed, 0),
    currentSessionStart: Date.now(),
  };
}
