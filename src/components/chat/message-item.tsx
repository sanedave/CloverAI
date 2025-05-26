
import type { Message } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { User, Image as ImageIcon, Download } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.sender === 'user';

  // If message is loading, text is "..."
  // Normal rendering handles this, as imageUrl will be undefined for the loading message.
  // No special block for message.isLoading is strictly needed here if text is "..."
  // and imageUrl is undefined during loading.

  return (
    <div className={cn('flex items-start gap-3 my-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.avatarUrl} alt={message.userName} data-ai-hint={message.dataAiHint || 'avatar'} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex flex-col max-w-[70%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'p-3 rounded-lg shadow-md',
            isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none'
          )}
        >
          {!isUser && (
            <p className="text-xs font-semibold text-muted-foreground mb-1">{message.userName}</p>
          )}
          {message.imageUrl && !message.isLoading ? (
            <div className="relative group">
              {message.text && <p className="text-sm whitespace-pre-wrap mb-2">{message.text}</p>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={message.imageUrl} 
                alt={message.text || "Generated image"} 
                className="rounded-md max-w-full h-auto object-contain" 
                data-ai-hint="generated image"
              />
              <a
                href={message.imageUrl}
                download={`darkchat_image_${message.id}.png`}
                className="absolute bottom-2 right-2 bg-background/70 p-1.5 rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
                title="Download image"
                aria-label="Download image"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ) : message.text ? ( // This will render "..." if message.isLoading is true and text is "..."
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          ) : (
            // Only show "Empty message" if not loading and no text/image
            !message.isLoading && <p className="text-sm text-muted-foreground italic flex items-center gap-1">
              <ImageIcon size={14} /> Empty message
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-1">
          {message.isLoading ? 'thinking...' : formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.avatarUrl} alt={message.userName} data-ai-hint={message.dataAiHint || 'avatar'} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
