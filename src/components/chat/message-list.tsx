
import type { Message } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './message-item';
import React from 'react';
import { Clover } from 'lucide-react'; // Assuming Clover icon might be desired

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          {/* You can use a Clover icon here if you have one, or just text */}
          {/* <Clover className="h-16 w-16 text-primary mb-4" /> */}
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            CLOVER AI
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your friendly AI assistant. How can I help you today?
          </p>
        </div>
      )}
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </ScrollArea>
  );
}
