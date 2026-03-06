// Skill dimensions
export type SkillDimension =
  | 'prompt-engineering'
  | 'api-integration'
  | 'agent-design'
  | 'evaluation'
  | 'production';

export const SKILL_DIMENSIONS: { id: SkillDimension; label: string }[] = [
  { id: 'prompt-engineering', label: 'Prompt Engineering' },
  { id: 'api-integration', label: 'API Integration' },
  { id: 'agent-design', label: 'Agent Design' },
  { id: 'evaluation', label: 'Evaluation & Testing' },
  { id: 'production', label: 'Production Deployment' },
];

// Skill levels
export type SkillLevel = 'foundations' | 'practitioner' | 'advanced';

export const SKILL_LEVEL_VALUES: Record<SkillLevel, number> = {
  foundations: 1,
  practitioner: 2,
  advanced: 3,
};

// Learner roles
export type LearnerRole =
  | 'developer'
  | 'product-manager'
  | 'designer'
  | 'business'
  | 'student';

export const LEARNER_ROLES: {
  id: LearnerRole;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: 'developer',
    label: 'Developer',
    description: 'Building software with Claude',
    icon: 'Code2',
  },
  {
    id: 'product-manager',
    label: 'Product Manager',
    description: 'Evaluating and planning AI features',
    icon: 'BarChart3',
  },
  {
    id: 'designer',
    label: 'Designer',
    description: 'Designing AI-powered experiences',
    icon: 'Palette',
  },
  {
    id: 'business',
    label: 'Business / Operations',
    description: 'Using AI to improve workflows',
    icon: 'Briefcase',
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Learning about AI and Claude',
    icon: 'GraduationCap',
  },
];

// Experience levels
export type ExperienceLevel = 'new' | 'familiar' | 'building';

export const EXPERIENCE_LEVELS: {
  id: ExperienceLevel;
  label: string;
  description: string;
}[] = [
  {
    id: 'new',
    label: 'New to AI',
    description: "I haven't used AI tools much yet",
  },
  {
    id: 'familiar',
    label: 'Familiar with AI',
    description: "I've used ChatGPT, Claude, or similar tools",
  },
  {
    id: 'building',
    label: 'Building with Claude',
    description: "I'm already using the Claude API or Claude Code",
  },
];

// Skills profile
export type SkillsProfile = Record<SkillDimension, SkillLevel>;

// Module section types
export interface ModuleExercise {
  prompt: string;
  hints?: string[];
  evaluationCriteria: string;
  sampleResponse?: string;
}

export interface ModuleSection {
  id: string;
  type: 'concept' | 'exercise' | 'takeaway' | 'check';
  title: string;
  content: string;
  exercise?: ModuleExercise;
}

// Learning module
export interface Module {
  id: string;
  title: string;
  description: string;
  track: string;
  trackTitle: string;
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  skillDimension: SkillDimension;
  learningObjectives: string[];
  sections: ModuleSection[];
}

// Module progress
export interface ModuleProgress {
  started: boolean;
  completed: boolean;
  completedSections: string[];
  exerciseResponses: Record<string, string>;
}

// Learning track
export interface Track {
  id: string;
  title: string;
  description: string;
  moduleIds: string[];
  color: string;
}

// Learner profile
export interface LearnerProfile {
  role: LearnerRole | null;
  experienceLevel: ExperienceLevel | null;
  skills: SkillsProfile;
  completedModules: string[];
  moduleProgress: Record<string, ModuleProgress>;
  learningPath: string[];
  assessmentComplete: boolean;
  streakDays: number;
  lastActiveDate: string;
}

// Chat message
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// API request types
export interface ChatRequest {
  messages: ChatMessage[];
  mode: 'assessment' | 'feedback' | 'companion';
  context: {
    role?: LearnerRole;
    experienceLevel?: ExperienceLevel;
    skills?: SkillsProfile;
    moduleId?: string;
    moduleTitle?: string;
    sectionTitle?: string;
    evaluationCriteria?: string;
    exercisePrompt?: string;
  };
}

// Default skills profile
export const DEFAULT_SKILLS: SkillsProfile = {
  'prompt-engineering': 'foundations',
  'api-integration': 'foundations',
  'agent-design': 'foundations',
  evaluation: 'foundations',
  production: 'foundations',
};
