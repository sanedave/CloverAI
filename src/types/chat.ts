
export interface Message {
  id: string;
  text?: string; // Text is now optional
  imageUrl?: string; // Optional field for image URLs (data URI)
  timestamp: Date;
  sender: 'user' | 'other';
  userName: string;
  avatarUrl?: string;
  dataAiHint?: string;
}

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
  status?: 'online' | 'offline';
}
