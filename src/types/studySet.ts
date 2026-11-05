/**
 * Flashwise Study Sets, Flashcards, and Review Types
 * Aligned with PlayGrid API Gateway (/api/v1/quizlet legacy prefix, Flashwise module) & Mock Server
 */

export type SetVisibility = "public" | "private" | "unlisted";

export type KnowledgeState =
  | "not_studied"
  | "learning"
  | "familiar"
  | "reviewing"
  | "mastered"
  | "new";

export interface CreatorSummary {
  id?: string;
  name: string;
  username?: string;
  avatar_url?: string;
}

export interface Flashcard {
  id: string;
  study_set_id: string;
  front_content: string;
  back_content: string;
  front_text?: string;
  back_text?: string;
  position?: number;
  hint?: string;
  explanation?: string;
  state?: KnowledgeState;
  next_review_at?: string;
  interval_days?: number;
  ease_factor?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudySet {
  id: string;
  user_id?: string;
  creator_id?: string;
  title: string;
  description?: string;
  is_public?: boolean;
  visibility?: SetVisibility;
  card_count: number;
  total_cards?: number;
  creator?: CreatorSummary;
  creator_name?: string;
  creator_avatar_url?: string;
  owner?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  is_starred?: boolean;
  created_at: string;
  updated_at: string;
  cards?: Flashcard[];
  term_language?: string;
  definition_language?: string;
  cover_url?: string;
  last_studied_at?: string;
  is_owner?: boolean;
}

export interface StudySetProgressSummary {
  study_set_id?: string;
  total_cards: number;
  mastered_count: number;
  familiar_count?: number;
  learning_count: number;
  new_count?: number;
  not_studied_count?: number;
  average_mastery?: number;
  last_studied_at?: string;
}

export interface StudySetDetail extends StudySet {
  cards: Flashcard[];
  progress?: StudySetProgressSummary;
  progress_summary?: StudySetProgressSummary;
}

export type StudySetFilter = "all" | "mine" | "recent" | "starred";

export interface StudySetListParams {
  filter?: StudySetFilter;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  page_size?: number;
  per_page?: number;
  sort?: string;
  sort_by?: string;
}

export interface StudySetPagination {
  page: number;
  page_size?: number;
  limit?: number;
  total: number;
  total_pages?: number;
}

export interface StudySetListResponse {
  items: StudySet[];
  total: number;
  pagination?: StudySetPagination;
}

export interface DueReviewCard {
  flashcard_id: string;
  study_set_id: string;
  set_title?: string;
  front_content: string;
  back_content: string;
  due_date?: string;
  overdue_hours?: number;
  mastery_score?: number;
  state?: KnowledgeState;
}

export interface DueReviewsSummary {
  due_count: number;
  next_due_at?: string | null;
  total_cards?: number;
  cards?: DueReviewCard[];
  not_studied?: number;
  learning?: number;
  reviewing?: number;
  mastered?: number;
  accuracy_rate?: number;
}

export interface CreateCardInput {
  front_content: string;
  back_content: string;
  hint?: string;
  explanation?: string;
}

export interface CreateStudySetPayload {
  title: string;
  description?: string;
  visibility?: SetVisibility;
  term_language?: string;
  definition_language?: string;
  cover_url?: string;
  cards?: CreateCardInput[];
  initial_cards?: CreateCardInput[];
}

export interface UpdateStudySetPayload {
  title?: string;
  description?: string;
  visibility?: SetVisibility;
  is_starred?: boolean;
  term_language?: string;
  definition_language?: string;
  cover_url?: string;
}
