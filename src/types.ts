export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  category?: string;
}

export interface Blog {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  designation?: string;
  organization?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  image?: string; // Base64 or URL
  created_at: string;
}
