
'use client';

import { useState, useEffect } from 'react';
import type { Message, Participant } from '@/types/chat';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { nanoid } from 'nanoid'; // For generating unique IDs
import { chatAssistant, type ChatAssistantInput, type ChatAssistantOutput } from '@/ai/flows/chatAssistantFlow';

// Mock current user
const MOCK_CURRENT_USER: Participant = {
  id: 'user_current',
  name: 'You',
  avatarUrl: 'https://placehold.co/100x100.png?a=1',
  isCurrentUser: true,
  status: 'online'
};

// AI Assistant Participant
const AI_ASSISTANT_PARTICIPANT: Participant = {
  id: 'user_ai_assistant',
  name: 'AI Assistant',
  avatarUrl: 'https://placehold.co/100x100/4CAF50/FFFFFF.png', 
  status: 'online',
  isCurrentUser: false,
};

// Mock other participants
const MOCK_PARTICIPANTS: Participant[] = [
  MOCK_CURRENT_USER,
  AI_ASSISTANT_PARTICIPANT,
];

// Mock initial messages - Set to empty array
const MOCK_INITIAL_MESSAGES: Message[] = [];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentUser, setCurrentUser] = useState<Participant | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiResponding, setIsAiResponding] = useState(false);

  useEffect(() => {
    setCurrentUser(MOCK_CURRENT_USER);
    setParticipants(MOCK_PARTICIPANTS);
    setMessages(MOCK_INITIAL_MESSAGES);
    setIsLoading(false);
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!currentUser || isAiResponding) return;

    const userMessage: Message = {
      id: nanoid(),
      text,
      timestamp: new Date(),
      sender: 'user',
      userName: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      dataAiHint: 'profile user',
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsAiResponding(true);

    const aiParticipant = participants.find(p => p.id === AI_ASSISTANT_PARTICIPANT.id);
    if (aiParticipant) {
      try {
        const aiResponse: ChatAssistantOutput = await chatAssistant({ userInput: text } as ChatAssistantInput);
        
        const assistantMessage: Message = {
          id: nanoid(),
          text: aiResponse.assistantResponse,
          imageUrl: aiResponse.imageUrl,
          timestamp: new Date(),
          sender: 'other',
          userName: aiParticipant.name,
          avatarUrl: aiParticipant.avatarUrl,
          dataAiHint: 'leaf logo',
        };
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      } catch (error) {
        console.error("AI Assistant Error:", error);
        const assistantErrorMessage: Message = {
          id: nanoid(),
          text: "Oops! The AI assistant is having a little trouble thinking right now.",
          timestamp: new Date(),
          sender: 'other',
          userName: aiParticipant.name, 
          avatarUrl: aiParticipant.avatarUrl, 
          dataAiHint: 'leaf logo',
        };
        setMessages((prevMessages) => [...prevMessages, assistantErrorMessage]);
      } finally {
        setIsAiResponding(false);
      }
    } else {
      setIsAiResponding(false); // Should not happen if AI participant is always in MOCK_PARTICIPANTS
    }
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
      <main className="flex flex-1 flex-col">
        <MessageList messages={messages} />
        <MessageInput onSendMessage={handleSendMessage} disabled={isAiResponding} />
      </main>
    </div>
  );
}
