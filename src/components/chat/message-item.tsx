
import type { Message } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { User, Image as ImageIcon, Download, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useRef, useEffect } from 'react';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.sender === 'user';
  const { toast } = useToast();
  const [isSpeakingThisMessage, setIsSpeakingThisMessage] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Effect to cancel speech if component unmounts while speaking
  useEffect(() => {
    return () => {
      // If this item was speaking and is unmounted, stop its speech.
      if (isSpeakingThisMessage && utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeakingThisMessage]);

  const handleSpeak = (textToSpeak: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (isSpeakingThisMessage) {
        // If this item is currently speaking, stop it.
        window.speechSynthesis.cancel(); // Stops all speech, including this one.
        setIsSpeakingThisMessage(false);
        if (utteranceRef.current) { // Clean up listeners from the explicitly stopped utterance
          utteranceRef.current.onstart = null;
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
          utteranceRef.current = null;
        }
        return; // Exit after stopping
      }

      // If this message item is not currently speaking, or nothing is.
      window.speechSynthesis.cancel(); // Stop any other ongoing speech first

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US'; 
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(voice => voice.lang === 'en-US' && !voice.default);
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }
      
      utteranceRef.current = utterance; // Store the new utterance

      utterance.onstart = () => {
        setIsSpeakingThisMessage(true);
      };

      utterance.onend = () => {
        setIsSpeakingThisMessage(false);
        if (utteranceRef.current === utterance) { // Ensure we only nullify if it's the same utterance
          utteranceRef.current = null;
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeakingThisMessage(false);
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
        }
        toast({
          variant: 'destructive',
          title: 'Speech Error',
          description: `Could not play audio: ${event.error}`,
        });
      };

      window.speechSynthesis.speak(utterance);

    } else {
      toast({
        variant: 'destructive',
        title: 'Unsupported Feature',
        description: 'Text-to-speech is not supported by your browser.',
      });
    }
  };

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
            isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none',
            !isUser && 'font-mono' 
          )}
        >
          {!isUser && (
            <p className="text-xs font-semibold text-muted-foreground mb-1">{message.userName}</p>
          )}
          
          {message.inputImageUrls && message.inputImageUrls.length > 0 && (
            <div className={cn("mb-2 grid gap-2", message.inputImageUrls.length > 1 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1")}>
              {message.inputImageUrls.map((url, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  key={index}
                  src={url} 
                  alt={`User uploaded image ${index + 1}`}
                  className="rounded-md max-w-full h-auto object-contain aspect-square"
                  data-ai-hint="user uploaded"
                />
              ))}
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
          ) : message.imageUrl ? ( 
            <div className="relative group">
              {message.text && (
                <div className="flex items-start gap-2 mb-2">
                  <p className="text-sm whitespace-pre-wrap flex-grow">{message.text}</p>
                  {!isUser && message.text && ( 
                     <button
                        onClick={() => handleSpeak(message.text!)}
                        className="p-1 text-card-foreground/70 hover:text-card-foreground transition-colors shrink-0"
                        title={isSpeakingThisMessage ? "Stop reading" : "Read aloud"}
                        aria-label={isSpeakingThisMessage ? "Stop reading" : "Read aloud"}
                      >
                        <Volume2 size={16} />
                      </button>
                  )}
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={message.imageUrl} 
                alt={message.text || "Generated image"} 
                className="rounded-md max-w-full h-auto object-contain" 
                data-ai-hint="generated image"
              />
              <a
                href={message.imageUrl}
                download={`clover_ai_image_${message.id}.png`}
                className="absolute bottom-2 right-2 bg-background/70 p-1.5 rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
                title="Download image"
                aria-label="Download image"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ) : message.text ? ( 
             <div className="flex items-start gap-2">
                <p className="text-sm whitespace-pre-wrap flex-grow">{message.text}</p>
                {!isUser && message.text && ( 
                  <button
                    onClick={() => handleSpeak(message.text!)}
                     className="p-1 text-card-foreground/70 hover:text-card-foreground transition-colors shrink-0"
                    title={isSpeakingThisMessage ? "Stop reading" : "Read aloud"}
                    aria-label={isSpeakingThisMessage ? "Stop reading" : "Read aloud"}
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
          ) : !(message.inputImageUrls && message.inputImageUrls.length > 0) ? ( 
             <p className="text-sm text-muted-foreground italic flex items-center gap-1">
              <ImageIcon size={14} /> Empty message
            </p>
          ) : null }
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
