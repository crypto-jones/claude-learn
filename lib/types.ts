// Skill dimensions — 18 unique across all roles
export type SkillDimension =
  // Shared
  | 'prompt-engineering'
  | 'evaluation'
  // Developer
  | 'api-integration'
  | 'agent-design'
  | 'production'
  // PM
  | 'ai-strategy'
  | 'stakeholder-comms'
  | 'ai-governance'
  // Designer
  | 'ai-ux-design'
  | 'conversational-design'
  | 'ai-research'
  | 'design-prototyping'
  // Business
  | 'workflow-automation'
  | 'content-communication'
  // Getting Started
  | 'ai-fundamentals'
  | 'practical-applications'
  | 'critical-thinking'
  | 'ai-ethics';

export type SkillDimensionInfo = { id: SkillDimension; label: string; shortLabel: string };

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
  | 'getting-started';

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
    id: 'getting-started',
    label: 'Getting Started',
    description: 'Explore what AI can do and find your path',
    icon: 'Compass',
  },
];

// Role-specific skill dimensions — each role has exactly 5
export const ROLE_SKILL_DIMENSIONS: Record<LearnerRole, SkillDimensionInfo[]> = {
  developer: [
    { id: 'prompt-engineering', label: 'Prompt Engineering', shortLabel: 'Prompting' },
    { id: 'api-integration', label: 'API Integration', shortLabel: 'API' },
    { id: 'agent-design', label: 'Agent Design', shortLabel: 'Agents' },
    { id: 'evaluation', label: 'Evaluation & Testing', shortLabel: 'Evaluation' },
    { id: 'production', label: 'Production Deployment', shortLabel: 'Production' },
  ],
  'product-manager': [
    { id: 'prompt-engineering', label: 'Prompt Engineering', shortLabel: 'Prompting' },
    { id: 'ai-strategy', label: 'AI Product Strategy', shortLabel: 'Strategy' },
    { id: 'evaluation', label: 'Evaluation & Metrics', shortLabel: 'Metrics' },
    { id: 'stakeholder-comms', label: 'Stakeholder Communication', shortLabel: 'Stakeholders' },
    { id: 'ai-governance', label: 'AI Governance', shortLabel: 'Governance' },
  ],
  designer: [
    { id: 'prompt-engineering', label: 'Prompt Engineering', shortLabel: 'Prompting' },
    { id: 'ai-ux-design', label: 'AI UX Design', shortLabel: 'UX Design' },
    { id: 'conversational-design', label: 'Conversational Design', shortLabel: 'Conversational' },
    { id: 'ai-research', label: 'AI Research & Synthesis', shortLabel: 'Research' },
    { id: 'design-prototyping', label: 'Design Prototyping', shortLabel: 'Prototyping' },
  ],
  business: [
    { id: 'prompt-engineering', label: 'Prompt Engineering', shortLabel: 'Prompting' },
    { id: 'workflow-automation', label: 'Workflow Automation', shortLabel: 'Automation' },
    { id: 'content-communication', label: 'Content & Communication', shortLabel: 'Content' },
    { id: 'evaluation', label: 'Measuring AI Impact', shortLabel: 'Impact' },
    { id: 'ai-governance', label: 'AI Governance', shortLabel: 'Governance' },
  ],
  'getting-started': [
    { id: 'ai-fundamentals', label: 'AI Fundamentals', shortLabel: 'Fundamentals' },
    { id: 'prompt-engineering', label: 'Prompt Basics', shortLabel: 'Prompting' },
    { id: 'practical-applications', label: 'Practical Applications', shortLabel: 'Applications' },
    { id: 'critical-thinking', label: 'Critical Thinking', shortLabel: 'Thinking' },
    { id: 'ai-ethics', label: 'AI Ethics & Safety', shortLabel: 'Ethics' },
  ],
};

// Flat deduped list of all dimensions (for fallback lookups)
export const ALL_SKILL_DIMENSIONS: SkillDimensionInfo[] = [
  { id: 'prompt-engineering', label: 'Prompt Engineering', shortLabel: 'Prompting' },
  { id: 'evaluation', label: 'Evaluation & Testing', shortLabel: 'Evaluation' },
  { id: 'api-integration', label: 'API Integration', shortLabel: 'API' },
  { id: 'agent-design', label: 'Agent Design', shortLabel: 'Agents' },
  { id: 'production', label: 'Production Deployment', shortLabel: 'Production' },
  { id: 'ai-strategy', label: 'AI Product Strategy', shortLabel: 'Strategy' },
  { id: 'stakeholder-comms', label: 'Stakeholder Communication', shortLabel: 'Stakeholders' },
  { id: 'ai-governance', label: 'AI Governance', shortLabel: 'Governance' },
  { id: 'ai-ux-design', label: 'AI UX Design', shortLabel: 'UX Design' },
  { id: 'conversational-design', label: 'Conversational Design', shortLabel: 'Conversational' },
  { id: 'ai-research', label: 'AI Research & Synthesis', shortLabel: 'Research' },
  { id: 'design-prototyping', label: 'Design Prototyping', shortLabel: 'Prototyping' },
  { id: 'workflow-automation', label: 'Workflow Automation', shortLabel: 'Automation' },
  { id: 'content-communication', label: 'Content & Communication', shortLabel: 'Content' },
  { id: 'ai-fundamentals', label: 'AI Fundamentals', shortLabel: 'Fundamentals' },
  { id: 'practical-applications', label: 'Practical Applications', shortLabel: 'Applications' },
  { id: 'critical-thinking', label: 'Critical Thinking', shortLabel: 'Thinking' },
  { id: 'ai-ethics', label: 'AI Ethics & Safety', shortLabel: 'Ethics' },
];

/** Look up a dimension's label, optionally using role-specific label */
export function getDimensionLabel(dimId: string, role?: LearnerRole | null): string {
  if (role) {
    const roleDim = ROLE_SKILL_DIMENSIONS[role]?.find((d) => d.id === dimId);
    if (roleDim) return roleDim.label;
  }
  const found = ALL_SKILL_DIMENSIONS.find((d) => d.id === dimId);
  return found ? found.label : dimId;
}

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

// Skills profile — keys are role-specific dimension IDs
export type SkillsProfile = Record<string, SkillLevel>;

// Module section types
export interface ModuleExercise {
  prompt: string;
  hints?: string[];
  evaluationCriteria: string;
  sampleResponse?: string;
}

export interface PlaygroundTemplate {
  systemPrompt: string;
  userMessage: string;
  description?: string;
  roleVariants?: Partial<Record<LearnerRole, {
    systemPrompt?: string;
    userMessage?: string;
    description?: string;
  }>>;
}

export interface ModuleSection {
  id: string;
  type: 'concept' | 'exercise' | 'takeaway' | 'check';
  title: string;
  content: string;
  exercise?: ModuleExercise;
  playground?: PlaygroundTemplate;
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
  targetRoles: LearnerRole[];
}

// Exercise feedback record
export interface ExerciseFeedback {
  response: string;
  feedback: string;
  timestamp: number;
  attemptNumber: number;
  conversation?: ChatMessage[];
}

// Module progress
export interface ModuleProgress {
  started: boolean;
  completed: boolean;
  completedSections: string[];
  exerciseResponses: Record<string, string>;
  exerciseFeedback: Record<string, ExerciseFeedback[]>;
  completedAt?: number;
  startedAt?: number;
}

// Learning goal
export interface LearningGoal {
  skillDimension: SkillDimension;
  targetLevel: SkillLevel;
  createdAt: number;
}

// Learning track
export interface Track {
  id: string;
  title: string;
  description: string;
  moduleIds: string[];
  color: string;
}

// Spaced repetition review
export interface ReviewItem {
  moduleId: string;
  nextReviewDate: string;
  interval: number;
  reviewCount: number;
}

// Learner profile
export interface LearnerProfile {
  role: LearnerRole | null;
  experienceLevel: ExperienceLevel | null;
  skills: SkillsProfile;
  initialSkills: SkillsProfile | null;
  completedModules: string[];
  moduleProgress: Record<string, ModuleProgress>;
  learningPath: string[];
  assessmentComplete: boolean;
  streakDays: number;
  lastActiveDate: string;
  totalMinutesLearned: number;
  currentSessionStart: number | null;
  learningGoals: LearningGoal[];
  reviews: ReviewItem[];
}

// Chat message
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// API request types
export interface ChatRequest {
  messages: ChatMessage[];
  mode: 'assessment' | 'feedback' | 'companion' | 'playground' | 'adapt';
  context: {
    role?: LearnerRole;
    experienceLevel?: ExperienceLevel;
    skills?: SkillsProfile;
    moduleId?: string;
    moduleTitle?: string;
    sectionTitle?: string;
    sectionContent?: string;
    evaluationCriteria?: string;
    exercisePrompt?: string;
    playgroundSystemPrompt?: string;
  };
}

/** Build a default skills profile for a role (all dimensions set to 'foundations') */
export function getDefaultSkills(role: LearnerRole | null): SkillsProfile {
  const dims = role ? ROLE_SKILL_DIMENSIONS[role] : ROLE_SKILL_DIMENSIONS['getting-started'];
  const skills: SkillsProfile = {};
  for (const dim of dims) {
    skills[dim.id] = 'foundations';
  }
  return skills;
}
