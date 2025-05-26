
export interface Message {
  id: string;
  text?: string; // Text is now optional
  imageUrl?: string; // Optional field for AI-generated image URLs (data URI)
  inputImageUrls?: string[]; // Optional field for user-uploaded image URLs (data URI array)
  timestamp: Date;
  sender: 'user' | 'other';
  userName: string;
  avatarUrl?: string;
  dataAiHint?: string;
  isLoading?: boolean; // Added for AI thinking state
}

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
  status?: 'online' | 'offline';
}
