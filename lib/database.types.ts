// Database types for the SchoolKit Supabase project.
// Hand-maintained to match supabase/migrations/20260728000000_initial_schema.sql.
// Once the project is live, this can be regenerated with:
//   supabase gen types typescript --project-id <ref> > lib/database.types.ts
// (keep the app-level aliases at the bottom if you do).

import type { DesignDocument } from '../features/design-editor/types/document';

export type UserRole = 'student-k8' | 'student-hs' | 'parent' | 'staff';
export type SchoolStatus =
  | 'current-treatment'
  | 'returning-after-treatment'
  | 'supporting-student'
  | 'special-needs';
export type StoryStatus = 'pending' | 'approved' | 'rejected';
/** App-level privilege role (distinct from Profile.role audience type). */
export type AppRole = 'admin' | 'moderator';

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  role: UserRole | null;
  school_statuses: SchoolStatus[];
  grade_level: string | null;
  topics: string[];
  profile_picture_url: string | null;
  is_completed: boolean;
  voice_id: string | null;
  preferred_language: string | null;
  created_at: string;
  updated_at: string;
};

export type Resource = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  icon: string;
  target_roles: UserRole[];
  design_id: string | null;
  owner_id: string | null;
  created_at: string;
};

export type Design = {
  id: string;
  owner_id: string;
  title: string;
  doc: DesignDocument;
  thumbnail_url: string | null;
  is_shared: boolean;
  share_token: string | null;
  published_resource_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DesignAsset = {
  id: string;
  design_id: string;
  owner_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number | null;
  created_at: string;
};

export type Journal = {
  id: string;
  user_id: string;
  title: string;
  cover_id: string;
  paper_id: string;
  created_at: string;
  updated_at: string;
};

export type JournalPageRow = {
  id: string;
  journal_id: string;
  page_index: number;
  text_entry: string;
  paths: PathData[];
  images: JournalImageData[];
  created_at: string;
  updated_at: string;
};

/** Drawing stroke stored in journal_pages.paths jsonb */
export type PathData = {
  path: string;
  color: string;
  strokeWidth: number;
};

/** Image metadata stored in journal_pages.images jsonb */
export type JournalImageData = {
  uri: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StoryRow = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  author_name: string;
  author_role: UserRole | null;
  looking_for: string[] | null;
  target_audiences: string[];
  story_tags: string[];
  status: StoryStatus;
  rejected_norms: string[];
  attempt_count: number;
  report_count: number;
  previous_title: string | null;
  previous_body: string | null;
  created_at: string;
  updated_at: string;
};

export type StoryCommentRow = {
  id: string;
  story_id: string;
  author_id: string;
  body: string;
  author_name: string;
  author_role: UserRole | null;
  report_count: number;
  created_at: string;
};

export type StoryBookmarkRow = {
  id: string;
  user_id: string;
  story_id: string;
  created_at: string;
};

export type StoryLikeRow = {
  id: string;
  user_id: string;
  story_id: string;
  created_at: string;
};

export type CommentLikeRow = {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: string;
};

export type StoryReportRow = {
  id: string;
  story_id: string;
  user_id: string;
  reason: string;
  details: string | null;
  created_at: string;
};

export type CommentReportRow = {
  id: string;
  comment_id: string;
  user_id: string;
  reason: string;
  details: string | null;
  created_at: string;
};

export type UserBookmarkRow = {
  id: string;
  user_id: string;
  resource_id: string;
  created_at: string;
};

export type EarnedAccomplishmentRow = {
  id: string;
  user_id: string;
  piece_id: string;
  earned_at: string;
  created_at: string;
};

export type ResourceProgressRow = {
  id: string;
  user_id: string;
  resource_id: string;
  is_opened: boolean;
  is_completed: boolean;
  updated_at: string;
};

export type UserQuestionRow = {
  id: string;
  user_id: string | null;
  question: string;
  role: UserRole | null;
  submitted_at: string;
};

// supabase-js v2 requires every table to declare Row/Insert/Update/Relationships,
// and the schema to declare Views/Functions/Enums/CompositeTypes — otherwise all
// queries degrade to `never`.
type TableDef<
  Row,
  Insert = Partial<Row>,
  Update = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        Profile,
        Partial<Profile> & { id: string },
        Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      >;
      resources: TableDef<
        Resource,
        Omit<Resource, 'id' | 'created_at' | 'owner_id'> & { id?: string; created_at?: string; owner_id?: string | null },
        Partial<Omit<Resource, 'id' | 'created_at'>>
      >;
      designs: TableDef<
        Design,
        Partial<Design> & { owner_id: string },
        Partial<Omit<Design, 'id' | 'created_at'>>
      >;
      design_assets: TableDef<
        DesignAsset,
        Omit<DesignAsset, 'id' | 'created_at' | 'file_size'> & { id?: string; file_size?: number | null },
        Partial<Omit<DesignAsset, 'id' | 'created_at'>>
      >;
      journals: TableDef<
        Journal,
        Omit<Journal, 'id' | 'created_at' | 'updated_at'> & { id?: string },
        Partial<Omit<Journal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      >;
      journal_pages: TableDef<
        JournalPageRow,
        Omit<JournalPageRow, 'id' | 'created_at' | 'updated_at'> & { id?: string },
        Partial<Omit<JournalPageRow, 'id' | 'journal_id' | 'created_at' | 'updated_at'>>
      >;
      stories: TableDef<
        StoryRow,
        Partial<StoryRow> & { author_id: string; title: string; body: string },
        Partial<Omit<StoryRow, 'id' | 'created_at'>>
      >;
      story_comments: TableDef<
        StoryCommentRow,
        Partial<StoryCommentRow> & { story_id: string; author_id: string; body: string },
        Partial<Omit<StoryCommentRow, 'id' | 'created_at'>>
      >;
      story_bookmarks: TableDef<
        StoryBookmarkRow,
        { user_id: string; story_id: string; id?: string; created_at?: string }
      >;
      story_likes: TableDef<
        StoryLikeRow,
        { user_id: string; story_id: string; id?: string; created_at?: string }
      >;
      comment_likes: TableDef<
        CommentLikeRow,
        { user_id: string; comment_id: string; id?: string; created_at?: string }
      >;
      story_reports: TableDef<
        StoryReportRow,
        { story_id: string; user_id: string; reason: string; details?: string | null; id?: string; created_at?: string }
      >;
      comment_reports: TableDef<
        CommentReportRow,
        { comment_id: string; user_id: string; reason: string; details?: string | null; id?: string; created_at?: string }
      >;
      user_bookmarks: TableDef<
        UserBookmarkRow,
        { user_id: string; resource_id: string; id?: string; created_at?: string }
      >;
      earned_accomplishments: TableDef<
        EarnedAccomplishmentRow,
        { user_id: string; piece_id: string; earned_at?: string; id?: string; created_at?: string }
      >;
      resource_progress: TableDef<
        ResourceProgressRow,
        { user_id: string; resource_id: string; is_opened?: boolean; is_completed?: boolean; id?: string; updated_at?: string }
      >;
      user_questions: TableDef<
        UserQuestionRow,
        { question: string; user_id?: string | null; role?: UserRole | null; id?: string; submitted_at?: string }
      >;
      user_roles: TableDef<
        UserRoleRow,
        { user_id: string; role: AppRole; id?: string; created_at?: string }
      >;
    };
    // NOTE: must be `{ [_ in never]: never }`, not Record<string, never> —
    // `keyof Record<string, never>` is `string`, which makes postgrest-js
    // treat every column as a computed field and Omit<> them all away.
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
      school_status: SchoolStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
