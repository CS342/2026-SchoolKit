import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'student-k8' | 'student-hs' | 'parent' | 'staff';
export type SchoolStatus = 'current-treatment' | 'returning-after-treatment' | 'supporting-student' | 'special-needs';

interface OnboardingData {
  name: string;
  role: UserRole | null;
  schoolStatuses: SchoolStatus[];
  gradeLevel: string;
  topics: string[];
  profilePicture: string | null;
  isCompleted: boolean;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateName: (name: string) => void;
  updateRole: (role: UserRole) => void;
  updateSchoolStatuses: (statuses: SchoolStatus[]) => void;
  updateGradeLevel: (level: string) => void;
  updateTopics: (topics: string[]) => void;
  updateProfilePicture: (uri: string | null) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialData: OnboardingData = {
  name: '',
  role: null,
  schoolStatuses: [],
  gradeLevel: '',
  topics: [],
  profilePicture: null,
  isCompleted: false,
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateName = (name: string) => {
    setData(prev => ({ ...prev, name }));
  };

  const updateRole = (role: UserRole) => {
    setData(prev => ({ ...prev, role }));
  };

  const updateSchoolStatuses = (statuses: SchoolStatus[]) => {
    setData(prev => ({ ...prev, schoolStatuses: statuses }));
  };

  const updateGradeLevel = (level: string) => {
    setData(prev => ({ ...prev, gradeLevel: level }));
  };

  const updateTopics = (topics: string[]) => {
    setData(prev => ({ ...prev, topics }));
  };

  const updateProfilePicture = (uri: string | null) => {
    setData(prev => ({ ...prev, profilePicture: uri }));
  };

  const completeOnboarding = () => {
    setData(prev => ({ ...prev, isCompleted: true }));
  };

  const resetOnboarding = () => {
    setData(initialData);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateName,
        updateRole,
        updateSchoolStatuses,
        updateGradeLevel,
        updateTopics,
        updateProfilePicture,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
