'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  LearnerProfile,
  LearnerRole,
  ExperienceLevel,
  SkillsProfile,
  SkillLevel,
  SkillDimension,
  ModuleProgress,
  ExerciseFeedback,
  ChatMessage,
  LearningGoal,
  ReviewItem,
} from '@/lib/types';
import { loadProfile, saveProfile, resetProfile, getDefaultProfile } from '@/lib/progress';

interface LearnerContextType {
  profile: LearnerProfile;
  isLoaded: boolean;
  saveError: boolean;
  dismissSaveError: () => void;
  setRole: (role: LearnerRole) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setSkills: (skills: SkillsProfile) => void;
  completeAssessment: (skills: SkillsProfile, path: string[]) => void;
  retakeAssessment: () => void;
  updateModuleProgress: (moduleId: string, progress: Partial<ModuleProgress>) => void;
  completeModule: (moduleId: string, skillDimension: SkillDimension) => void;
  saveExerciseFeedback: (moduleId: string, sectionId: string, fb: ExerciseFeedback) => void;
  updateExerciseFeedback: (moduleId: string, sectionId: string, conversation: ChatMessage[]) => void;
  setLearningPath: (path: string[]) => void;
  addLearningGoal: (goal: LearningGoal) => void;
  removeLearningGoal: (skillDimension: SkillDimension) => void;
  addReview: (review: ReviewItem) => void;
  completeReview: (moduleId: string) => void;
  addMinutesLearned: (minutes: number) => void;
  reset: () => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export function LearnerProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<LearnerProfile>(getDefaultProfile());
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  // Centralized save helper — surfaces localStorage failures to the UI
  const persistProfile = useCallback((updated: LearnerProfile) => {
    if (!saveProfile(updated)) setSaveError(true);
  }, []);

  const dismissSaveError = useCallback(() => setSaveError(false), []);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    setIsLoaded(true);
  }, []);

  // Persist on page unload — uses ref to always read latest profile
  // Only register after profile is loaded to avoid overwriting with defaults
  useEffect(() => {
    if (!isLoaded) return;
    const handleUnload = () => {
      saveProfile(profileRef.current);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isLoaded]);

  // Expose test helper for injecting profiles (dev only)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as unknown as Record<string, unknown>).__setTestProfile = (p: LearnerProfile) => {
        setProfile(p);
        persistProfile(p);
      };
    }
  }, [persistProfile]);

  const updateProfile = useCallback((updates: Partial<LearnerProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const setRole = useCallback(
    (role: LearnerRole) => updateProfile({ role }),
    [updateProfile]
  );

  const setExperienceLevel = useCallback(
    (level: ExperienceLevel) => updateProfile({ experienceLevel: level }),
    [updateProfile]
  );

  const setSkills = useCallback(
    (skills: SkillsProfile) => updateProfile({ skills }),
    [updateProfile]
  );

  const completeAssessment = useCallback(
    (skills: SkillsProfile, path: string[]) => {
      setProfile((prev) => {
        const updated = {
          ...prev,
          skills,
          learningPath: path,
          assessmentComplete: true,
          streakDays: prev.streakDays || 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          initialSkills: prev.initialSkills || skills,
        };
        persistProfile(updated);
        return updated;
      });
    },
    [persistProfile]
  );

  const retakeAssessment = useCallback(() => {
    updateProfile({ assessmentComplete: false, initialSkills: null });
  }, [updateProfile]);

  const updateModuleProgress = useCallback(
    (moduleId: string, progress: Partial<ModuleProgress>) => {
      setProfile((prev) => {
        const existing = prev.moduleProgress[moduleId] || {
          started: false,
          completed: false,
          completedSections: [],
          exerciseResponses: {},
          exerciseFeedback: {},
        };
        const updated = {
          ...prev,
          moduleProgress: {
            ...prev.moduleProgress,
            [moduleId]: {
              ...existing,
              ...progress,
              started: true,
              startedAt: existing.startedAt || Date.now(),
            },
          },
        };
        persistProfile(updated);
        return updated;
      });
    },
    [persistProfile]
  );

  const completeModule = useCallback(
    (moduleId: string, skillDimension: SkillDimension) => {
      setProfile((prev) => {
        const completedModules = prev.completedModules.includes(moduleId)
          ? prev.completedModules
          : [...prev.completedModules, moduleId];
        const existing = prev.moduleProgress[moduleId] || {
          started: true,
          completed: false,
          completedSections: [],
          exerciseResponses: {},
          exerciseFeedback: {},
        };

        // Bump skill level for the module's dimension
        const currentLevel = prev.skills[skillDimension];
        const nextLevel: SkillLevel =
          currentLevel === 'foundations'
            ? 'practitioner'
            : currentLevel === 'practitioner'
              ? 'advanced'
              : 'advanced';
        const updatedSkills = { ...prev.skills, [skillDimension]: nextLevel };

        // Schedule spaced repetition review (first in 3 days)
        const existingReview = prev.reviews.find((r) => r.moduleId === moduleId);
        const reviews = existingReview
          ? prev.reviews
          : [
              ...prev.reviews,
              {
                moduleId,
                nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                interval: 3,
                reviewCount: 0,
              },
            ];

        const updated = {
          ...prev,
          completedModules,
          skills: updatedSkills,
          reviews,
          moduleProgress: {
            ...prev.moduleProgress,
            [moduleId]: { ...existing, completed: true, completedAt: Date.now() },
          },
        };
        persistProfile(updated);
        return updated;
      });
    },
    [persistProfile]
  );

  const saveExerciseFeedback = useCallback(
    (moduleId: string, sectionId: string, fb: ExerciseFeedback) => {
      setProfile((prev) => {
        const existing = prev.moduleProgress[moduleId] || {
          started: true,
          completed: false,
          completedSections: [],
          exerciseResponses: {},
          exerciseFeedback: {},
        };
        const existingFeedback = existing.exerciseFeedback?.[sectionId] || [];
        const updated = {
          ...prev,
          moduleProgress: {
            ...prev.moduleProgress,
            [moduleId]: {
              ...existing,
              exerciseFeedback: {
                ...existing.exerciseFeedback,
                [sectionId]: [...existingFeedback, fb],
              },
            },
          },
        };
        persistProfile(updated);
        return updated;
      });
    },
    [persistProfile]
  );

  const updateExerciseFeedback = useCallback(
    (moduleId: string, sectionId: string, conversation: ChatMessage[]) => {
      setProfile((prev) => {
        const existing = prev.moduleProgress[moduleId];
        if (!existing) return prev;
        const feedbackArr = existing.exerciseFeedback?.[sectionId];
        if (!feedbackArr || feedbackArr.length === 0) return prev;
        const updatedFeedback = [...feedbackArr];
        updatedFeedback[updatedFeedback.length - 1] = {
          ...updatedFeedback[updatedFeedback.length - 1],
          conversation,
        };
        const updated = {
          ...prev,
          moduleProgress: {
            ...prev.moduleProgress,
            [moduleId]: {
              ...existing,
              exerciseFeedback: {
                ...existing.exerciseFeedback,
                [sectionId]: updatedFeedback,
              },
            },
          },
        };
        persistProfile(updated);
        return updated;
      });
    },
    [persistProfile]
  );

  const setLearningPath = useCallback(
    (path: string[]) => updateProfile({ learningPath: path }),
    [updateProfile]
  );

  const addLearningGoal = useCallback(
    (goal: LearningGoal) => {
      setProfile((prev) => {
        const filtered = prev.learningGoals.filter(
          (g) => g.skillDimension !== goal.skillDimension
        );
        const updated = { ...prev, learningGoals: [...filtered, goal] };
        persistProfile(updated);
        return updated;
      });
    },
    [persistProfile]
  );

  const removeLearningGoal = useCallback(
    (skillDimension: SkillDimension) => {
      setProfile((prev) => {
        const updated = {
          ...prev,
          learningGoals: prev.learningGoals.filter(
            (g) => g.skillDimension !== skillDimension
          ),
        };
        persistProfile(updated);
        return updated;
      });
    },
    [persistProfile]
  );

  const addReview = useCallback(
    (review: ReviewItem) => {
      setProfile((prev) => {
        const filtered = prev.reviews.filter((r) => r.moduleId !== review.moduleId);
        const updated = { ...prev, reviews: [...filtered, review] };
        persistProfile(updated);
        return updated;
      });
    },
    [persistProfile]
  );

  const completeReview = useCallback(
    (moduleId: string) => {
      setProfile((prev) => {
        const review = prev.reviews.find((r) => r.moduleId === moduleId);
        if (!review) return prev;
        const nextInterval = Math.min(review.interval * 2, 30);
        const nextDate = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        const updatedReviews = prev.reviews.map((r) =>
          r.moduleId === moduleId
            ? { ...r, interval: nextInterval, nextReviewDate: nextDate, reviewCount: r.reviewCount + 1 }
            : r
        );
        const updated = { ...prev, reviews: updatedReviews };
        persistProfile(updated);
        return updated;
      });
    },
    [persistProfile]
  );

  const addMinutesLearned = useCallback((minutes: number) => {
    if (minutes <= 0) return;
    setProfile((prev) => {
      const updated = { ...prev, totalMinutesLearned: prev.totalMinutesLearned + minutes };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const reset = useCallback(() => {
    resetProfile();
    setProfile(getDefaultProfile());
  }, []);

  return (
    <LearnerContext.Provider
      value={{
        profile,
        isLoaded,
        saveError,
        dismissSaveError,
        setRole,
        setExperienceLevel,
        setSkills,
        completeAssessment,
        retakeAssessment,
        updateModuleProgress,
        completeModule,
        saveExerciseFeedback,
        updateExerciseFeedback,
        setLearningPath,
        addLearningGoal,
        removeLearningGoal,
        addReview,
        completeReview,
        addMinutesLearned,
        reset,
      }}
    >
      {saveError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <span>Unable to save progress — storage may be full</span>
          <button
            onClick={dismissSaveError}
            className="ml-1 rounded-md p-0.5 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors"
            aria-label="Dismiss save error"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {children}
    </LearnerContext.Provider>
  );
}

export function useLearner() {
  const context = useContext(LearnerContext);
  if (!context) {
    throw new Error('useLearner must be used within a LearnerProvider');
  }
  return context;
}
