
export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  sender: 'user' | 'other';
  userName: string;
  avatarUrl?: string;
  dataAiHint?: string; // Added for specific AI hints on avatars
}

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
  status?: 'online' | 'offline'; // Optional: for future presence indication
}
