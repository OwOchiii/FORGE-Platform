// User types
export type UserRole = 'trainee' | 'course_admin' | 'platform_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Course types
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  creatorId: string;
  status: CourseStatus;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  createdAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  videoUrl?: string;
  videoStoragePath?: string;
  resources?: Record<string, string>[];
  order: number;
  createdAt: Date;
}

// Progress types
export type ProgressStatus = 'in_progress' | 'completed' | 'failed';

export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  enrollmentDate: Date;
  progressPercentage: number;
  status: ProgressStatus;
  lastAccessed: Date;
}

export interface LessonCompletion {
  id: string;
  userId: string;
  lessonId: string;
  completedAt: Date;
  timeSpentMinutes: number;
}

// AI types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  courseId?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Moderation types
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ModerationReport {
  id: string;
  reportedById: string;
  reportType: string;
  content: string;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Sales Simulator types
export type CustomerScenario = 'skeptical' | 'warm_lead' | 'random';
export type CustomerStage = 'early' | 'mid' | 'closing' | 'closed';
export type SaleOutcome = 'buy' | 'need_more_info' | 'reject' | null;

export interface ConversationMessage {
  id: string;
  role: 'trainee' | 'customer';
  content: string;
  transcription?: string;
  audioUrl?: string;
  timestamp: Date;
}

export interface TurnScore {
  turnNumber: number;
  score: number;
  feedback: string;
}

export interface SalesSession {
  id: string;
  userId: string;
  lessonId: string;
  scenario: CustomerScenario;
  messages: ConversationMessage[];
  metrics: SalesMetrics;
  turnScores: TurnScore[];
  finalSessionScore?: number;
  currentStage: CustomerStage;
  saleOutcome: SaleOutcome;
  isConversationComplete: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface SalesMetrics {
  convictionRate: number; // 0-100: how convinced the customer is
  pitchQuality: number; // 0-100: quality of the pitch
  engagementScore: number; // 0-100: overall engagement
  turnsToClose: number; // number of back-and-forth turns before closing
  keyObjectionsHandled: number; // how many objections successfully addressed
  turnScore?: number; // Current turn score
  finalSessionScore?: number; // Session average score
  stage?: CustomerStage;
  outcome?: SaleOutcome;
}

export interface SalesScenario {
  id: string;
  name: string;
  type: CustomerScenario;
  productName: string;
  productDescription: string;
  customerPersonality: string;
  initialObjection?: string;
  winConditions: string[];
}
