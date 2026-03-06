'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  LearnerProfile,
  LearnerRole,
  ExperienceLevel,
  SkillsProfile,
  SkillLevel,
  SkillDimension,
  ModuleProgress,
  ExerciseFeedback,
  LearningGoal,
  ReviewItem,
} from '@/lib/types';
import { loadProfile, saveProfile, resetProfile, getDefaultProfile, flushSessionTime } from '@/lib/progress';

interface LearnerContextType {
  profile: LearnerProfile;
  isLoaded: boolean;
  setRole: (role: LearnerRole) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setSkills: (skills: SkillsProfile) => void;
  completeAssessment: (skills: SkillsProfile, path: string[]) => void;
  retakeAssessment: () => void;
  updateModuleProgress: (moduleId: string, progress: Partial<ModuleProgress>) => void;
  completeModule: (moduleId: string, skillDimension: SkillDimension) => void;
  saveExerciseFeedback: (moduleId: string, sectionId: string, fb: ExerciseFeedback) => void;
  setLearningPath: (path: string[]) => void;
  addLearningGoal: (goal: LearningGoal) => void;
  removeLearningGoal: (skillDimension: SkillDimension) => void;
  addReview: (review: ReviewItem) => void;
  completeReview: (moduleId: string) => void;
  flushSession: () => void;
  reset: () => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export function LearnerProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<LearnerProfile>(getDefaultProfile());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    setIsLoaded(true);
  }, []);

  // Flush session time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setProfile((prev) => {
        const updated = flushSessionTime(prev);
        saveProfile(updated);
        return updated;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Flush session time on page unload
  useEffect(() => {
    const handleUnload = () => {
      const flushed = flushSessionTime(profile);
      saveProfile(flushed);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [profile]);

  const updateProfile = useCallback((updates: Partial<LearnerProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      saveProfile(updated);
      return updated;
    });
  }, []);

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
        saveProfile(updated);
        return updated;
      });
    },
    []
  );

  const retakeAssessment = useCallback(() => {
    updateProfile({ assessmentComplete: false });
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
        saveProfile(updated);
        return updated;
      });
    },
    []
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
        saveProfile(updated);
        return updated;
      });
    },
    []
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
        saveProfile(updated);
        return updated;
      });
    },
    []
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
        saveProfile(updated);
        return updated;
      });
    },
    []
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
        saveProfile(updated);
        return updated;
      });
    },
    []
  );

  const addReview = useCallback(
    (review: ReviewItem) => {
      setProfile((prev) => {
        const filtered = prev.reviews.filter((r) => r.moduleId !== review.moduleId);
        const updated = { ...prev, reviews: [...filtered, review] };
        saveProfile(updated);
        return updated;
      });
    },
    []
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
        saveProfile(updated);
        return updated;
      });
    },
    []
  );

  const flushSession = useCallback(() => {
    setProfile((prev) => {
      const updated = flushSessionTime(prev);
      saveProfile(updated);
      return updated;
    });
  }, []);

  const reset = useCallback(() => {
    resetProfile();
    setProfile(getDefaultProfile());
  }, []);

  return (
    <LearnerContext.Provider
      value={{
        profile,
        isLoaded,
        setRole,
        setExperienceLevel,
        setSkills,
        completeAssessment,
        retakeAssessment,
        updateModuleProgress,
        completeModule,
        saveExerciseFeedback,
        setLearningPath,
        addLearningGoal,
        removeLearningGoal,
        addReview,
        completeReview,
        flushSession,
        reset,
      }}
    >
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
