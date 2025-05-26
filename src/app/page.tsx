
'use client';

import { useState, useEffect } from 'react';
import type { Message, Participant } from '@/types/chat';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { nanoid } from 'nanoid'; // For generating unique IDs
import { chatAssistant, type ChatAssistantInput, type ChatAssistantOutput } from '@/ai/flows/chatAssistantFlow';

import { Settings, Sun, Moon, Palette, Info, Phone, Mail, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  name: 'CLOVER AI',
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

  // Settings state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    // Set initial theme from localStorage or default to dark
    const storedTheme = localStorage.getItem('chat-theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme('dark'); // Default to dark
    }

    setCurrentUser(MOCK_CURRENT_USER);
    setParticipants(MOCK_PARTICIPANTS);
    setMessages(MOCK_INITIAL_MESSAGES);
    setIsLoading(false);
  }, []);

  // Effect for applying theme to HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('chat-theme', theme);
  }, [theme]);

  // Effect for loading speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
      setAvailableVoices(voices);
      
      const storedVoiceName = localStorage.getItem('chat-selected-voice');
      if (storedVoiceName && voices.some(v => v.name === storedVoiceName)) {
        setSelectedVoiceName(storedVoiceName);
      } else if (voices.length > 0) {
        const preferredVoice = voices.find(v => v.lang === 'en-US' && !v.default) || voices.find(v => v.lang === 'en-US') || voices[0];
        if (preferredVoice) {
          setSelectedVoiceName(preferredVoice.name);
          localStorage.setItem('chat-selected-voice', preferredVoice.name);
        }
      }
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      } else {
        loadVoices();
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);


  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    localStorage.setItem('chat-selected-voice', voiceName);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleSendMessage = async (text: string, inputImageDataUris?: string[]) => {
    if (!currentUser || isAiResponding) return;

    const userMessage: Message = {
      id: nanoid(),
      text: text || undefined,
      inputImageUrls: inputImageDataUris,
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
      const thinkingMessageId = nanoid();
      const tempThinkingMessage: Message = {
        id: thinkingMessageId,
        text: '...', 
        timestamp: new Date(),
        sender: 'other',
        userName: aiParticipant.name,
        avatarUrl: aiParticipant.avatarUrl,
        dataAiHint: 'leaf logo',
        isLoading: true,
      };
      setMessages((prevMessages) => [...prevMessages, tempThinkingMessage]);

      try {
        const aiInput: ChatAssistantInput = { userInput: text };
        if (inputImageDataUris && inputImageDataUris.length > 0) {
          aiInput.inputImageDataUris = inputImageDataUris;
        }
        const aiResponse: ChatAssistantOutput = await chatAssistant(aiInput);
        
        const assistantMessage: Message = {
          id: thinkingMessageId, 
          text: aiResponse.assistantResponse,
          imageUrl: aiResponse.imageUrl,
          timestamp: new Date(), 
          sender: 'other',
          userName: aiParticipant.name,
          avatarUrl: aiParticipant.avatarUrl,
          dataAiHint: 'leaf logo',
          isLoading: false, 
        };
        setMessages((prevMessages) =>
          prevMessages.map(msg => msg.id === thinkingMessageId ? assistantMessage : msg)
        );

      } catch (error) {
        console.error("AI Assistant Error:", error);
        const assistantErrorMessage: Message = {
          id: thinkingMessageId, 
          text: "Oops! CLOVER AI is having a little trouble thinking right now.",
          timestamp: new Date(),
          sender: 'other',
          userName: aiParticipant.name, 
          avatarUrl: aiParticipant.avatarUrl, 
          dataAiHint: 'leaf logo',
          isLoading: false,
        };
        setMessages((prevMessages) =>
          prevMessages.map(msg => msg.id === thinkingMessageId ? assistantErrorMessage : msg)
        );
      } finally {
        setIsAiResponding(false);
      }
    } else {
      setIsAiResponding(false); 
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
    <div className="flex h-screen overflow-hidden bg-background text-foreground relative">
      <header className="absolute top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette className="mr-2 h-4 w-4" />
                <span>Personalization</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                    <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Voice Selection</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={selectedVoiceName} onValueChange={handleVoiceChange}>
                    {availableVoices.length > 0 ? (
                      availableVoices.map((voice) => (
                        <DropdownMenuRadioItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </DropdownMenuRadioItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>No voices available</DropdownMenuItem>
                    )}
                  </DropdownMenuRadioGroup>
                   <DropdownMenuLabel className="text-xs text-muted-foreground pt-1">
                    Note: Specific voices (e.g., baby, child) depend on your browser/OS.
                  </DropdownMenuLabel>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsAboutModalOpen(true)}>
              <Info className="mr-2 h-4 w-4" />
              <span>About</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsContactModalOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              <span>Contact Us</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex flex-1 flex-col">
        <MessageList messages={messages} selectedVoiceName={selectedVoiceName} />
        <MessageInput onSendMessage={handleSendMessage} disabled={isAiResponding} />
      </main>

      {/* About Dialog */}
      <Dialog open={isAboutModalOpen} onOpenChange={setIsAboutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary"/>About EHIREMEN OYAS & CLOVER AI</DialogTitle>
            <DialogDescription className="text-left pt-2">
              CLOVER AI is a friendly and helpful AI assistant created by EHIREMEN OYAS.
              <br /><br />
              EHIREMEN OYAS is an innovative developer and visionary, passionate about creating intelligent AI assistants
              that can engage in detailed conversations, generate creative content including images, and assist users with a wide range of tasks.
              This application showcases some of these capabilities.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Us Dialog */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary"/>Contact Us</DialogTitle>
            <DialogDescription className="text-left pt-2">
              For inquiries, please reach out to EHIREMEN OYAS:
              <ul className="list-none space-y-1 mt-2">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground"/> 
                  <span>Email: contact@ehiremenoyas.dev (placeholder)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground"/> 
                  <span>Phone: +1 (555) 123-4567 (placeholder)</span>
                </li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
             <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
