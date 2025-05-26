'use client';

import { useState, useEffect } from 'react';
import type { Message, Participant } from '@/types/chat';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { ParticipantsPanel } from '@/components/chat/participants-panel';
import { nanoid } from 'nanoid'; // For generating unique IDs

// Mock current user
const MOCK_CURRENT_USER: Participant = {
  id: 'user_current',
  name: 'You',
  avatarUrl: 'https://placehold.co/100x100.png?a=1',
  isCurrentUser: true,
  status: 'online'
};

// Mock other participants
const MOCK_PARTICIPANTS: Participant[] = [
  MOCK_CURRENT_USER,
  { id: 'user_jane', name: 'Jane Doe', avatarUrl: 'https://placehold.co/100x100.png?a=2', status: 'online' },
  { id: 'user_john', name: 'John Smith', avatarUrl: 'https://placehold.co/100x100.png?a=3', status: 'offline' },
];

// Mock initial messages
const MOCK_INITIAL_MESSAGES: Message[] = [
  {
    id: nanoid(),
    text: 'Hey everyone! How is it going?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    sender: 'other',
    userName: 'Jane Doe',
    avatarUrl: 'https://placehold.co/100x100.png?a=2',
  },
  {
    id: nanoid(),
    text: "Hi Jane! Doing great, just setting up this new chat app. What do you think of the dark theme? ✨",
    timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
    sender: 'user',
    userName: MOCK_CURRENT_USER.name,
    avatarUrl: MOCK_CURRENT_USER.avatarUrl,
  },
  {
    id: nanoid(),
    text: "Looks sleek! Very modern. The purple accents are a nice touch. 💜",
    timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
    sender: 'other',
    userName: 'Jane Doe',
    avatarUrl: 'https://placehold.co/100x100.png?a=2',
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentUser, setCurrentUser] = useState<Participant | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setCurrentUser(MOCK_CURRENT_USER);
    setParticipants(MOCK_PARTICIPANTS);
    setMessages(MOCK_INITIAL_MESSAGES);
    setIsLoading(false);
  }, []);

  const handleSendMessage = (text: string) => {
    if (!currentUser) return;

    const newMessage: Message = {
      id: nanoid(),
      text,
      timestamp: new Date(),
      sender: 'user',
      userName: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // Simulate a reply from another user after a short delay
    setTimeout(() => {
      const otherParticipant = participants.find(p => p.id !== currentUser.id && p.name === 'Jane Doe'); // Find Jane
      if (otherParticipant) {
        const replyMessage: Message = {
          id: nanoid(),
          text: `Got it, "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"! 👍`,
          timestamp: new Date(),
          sender: 'other',
          userName: otherParticipant.name,
          avatarUrl: otherParticipant.avatarUrl,
        };
        setMessages((prevMessages) => [...prevMessages, replyMessage]);
      }
    }, 1500);
  };
  
  if (isLoading) {
     return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p className="text-lg text-foreground">Loading DarkChat...</p>
        </div>
      );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col">
        <MessageList messages={messages} />
        <MessageInput onSendMessage={handleSendMessage} />
      </main>

      {/* Participants Panel - hidden on small screens, shown on medium and up */}
      <aside className="hidden md:flex md:w-80 lg:w-96 border-l border-border bg-card">
        <ParticipantsPanel participants={participants} currentUser={currentUser} />
      </aside>
    </div>
  );
}
