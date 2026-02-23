export type UserRole = 'student-k8' | 'student-hs' | 'parent' | 'staff';
export type SchoolStatus =
  | 'current-treatment'
  | 'returning-after-treatment'
  | 'supporting-student'
  | 'special-needs';

export type Profile = {
  id: string;
  name: string;
  role: UserRole | null;
  school_statuses: SchoolStatus[];
  grade_level: string | null;
  topics: string[];
  profile_picture_url: string | null;
  is_completed: boolean;
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
  created_at: string;
};

import type { DesignDocument } from '../features/design-editor/types/document';

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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      resources: {
        Row: Resource;
        Insert: Omit<Resource, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Resource, 'id' | 'created_at'>>;
      };
      designs: {
        Row: Design;
        Insert: Partial<Design> & { owner_id: string };
        Update: Partial<Omit<Design, 'id' | 'created_at'>>;
      };
      design_assets: {
        Row: DesignAsset;
        Insert: Omit<DesignAsset, 'id' | 'created_at'>;
        Update: Partial<Omit<DesignAsset, 'id' | 'created_at'>>;
      };
    };
  };
};
