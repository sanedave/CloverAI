'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [messageText, setMessageText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-4 md:p-6 bg-background">
      <Input
        type="text"
        placeholder="Type a message..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        className="flex-grow bg-input placeholder:text-muted-foreground rounded-full px-4"
        disabled={disabled}
        aria-label="Message input"
      />
      <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90" disabled={disabled || !messageText.trim()} aria-label="Send message">
        <Send className="h-5 w-5 text-primary-foreground" />
      </Button>
    </form>
  );
}
