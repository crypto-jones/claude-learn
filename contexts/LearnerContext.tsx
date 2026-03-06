'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  LearnerProfile,
  LearnerRole,
  ExperienceLevel,
  SkillsProfile,
  ModuleProgress,
} from '@/lib/types';
import { loadProfile, saveProfile, resetProfile, getDefaultProfile } from '@/lib/progress';

interface LearnerContextType {
  profile: LearnerProfile;
  isLoaded: boolean;
  setRole: (role: LearnerRole) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setSkills: (skills: SkillsProfile) => void;
  completeAssessment: (skills: SkillsProfile, path: string[]) => void;
  updateModuleProgress: (moduleId: string, progress: Partial<ModuleProgress>) => void;
  completeModule: (moduleId: string) => void;
  setLearningPath: (path: string[]) => void;
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
    (skills: SkillsProfile, path: string[]) =>
      updateProfile({
        skills,
        learningPath: path,
        assessmentComplete: true,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
      }),
    [updateProfile]
  );

  const updateModuleProgress = useCallback(
    (moduleId: string, progress: Partial<ModuleProgress>) => {
      setProfile((prev) => {
        const existing = prev.moduleProgress[moduleId] || {
          started: false,
          completed: false,
          completedSections: [],
          exerciseResponses: {},
        };
        const updated = {
          ...prev,
          moduleProgress: {
            ...prev.moduleProgress,
            [moduleId]: { ...existing, ...progress, started: true },
          },
        };
        saveProfile(updated);
        return updated;
      });
    },
    []
  );

  const completeModule = useCallback(
    (moduleId: string) => {
      setProfile((prev) => {
        const completedModules = prev.completedModules.includes(moduleId)
          ? prev.completedModules
          : [...prev.completedModules, moduleId];
        const existing = prev.moduleProgress[moduleId] || {
          started: true,
          completed: false,
          completedSections: [],
          exerciseResponses: {},
        };
        const updated = {
          ...prev,
          completedModules,
          moduleProgress: {
            ...prev.moduleProgress,
            [moduleId]: { ...existing, completed: true },
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
        updateModuleProgress,
        completeModule,
        setLearningPath,
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
