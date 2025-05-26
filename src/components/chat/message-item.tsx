
import type { Message } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { User, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.sender === 'user';

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
          {message.imageUrl ? (
            <>
              {message.text && <p className="text-sm whitespace-pre-wrap mb-2">{message.text}</p>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={message.imageUrl} 
                alt={message.text || "Generated image"} 
                className="rounded-md max-w-full h-auto object-contain" 
                data-ai-hint="generated image"
              />
            </>
          ) : message.text ? (
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic flex items-center gap-1">
              <ImageIcon size={14} /> Empty message
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-1">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
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
