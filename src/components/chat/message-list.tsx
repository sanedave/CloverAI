import type { Message } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './message-item';
import React from 'react';

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
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
        </div>
      )}
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </ScrollArea>
  );
}
