export interface Customer {
  id: string;
  name: string;
  shirt_measurements: string | null;
  pants_measurements: string | null;
  other_measurements: string | null;
  phone: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}