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
    };
  };
};
