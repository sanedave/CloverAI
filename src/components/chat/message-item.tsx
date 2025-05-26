
import type { Message } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { User, Image as ImageIcon, Download } from 'lucide-react';
import NextImage from 'next/image'; // Use NextImage for consistency if desired, or img for data URIs

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
          
          {/* Display user-uploaded image if present */}
          {message.inputImageUrl && (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={message.inputImageUrl} 
                alt="User uploaded image" 
                className="rounded-md max-w-full h-auto object-contain"
                data-ai-hint="user uploaded"
              />
            </div>
          )}

          {message.isLoading ? (
            <div className="flex items-center justify-center py-2">
              <div className="flex space-x-1.5">
                <span className="dot-style animate-dot-hover1"></span>
                <span className="dot-style animate-dot-hover2"></span>
                <span className="dot-style animate-dot-hover3"></span>
              </div>
            </div>
          ) : message.imageUrl ? ( // AI-generated image
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
          ) : message.text ? ( // Regular text message
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          ) : !message.inputImageUrl ? ( // If no text, no AI image, and no user uploaded image
             <p className="text-sm text-muted-foreground italic flex items-center gap-1">
              <ImageIcon size={14} /> Empty message
            </p>
          ) : null /* If only inputImageUrl, text can be empty, so render nothing extra here */ }
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
