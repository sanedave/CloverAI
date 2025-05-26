
'use client';

import { useState, type FormEvent, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, XCircle, Camera as CameraIcon } from 'lucide-react';
import Image from 'next/image'; // For previewing image
import { CameraCaptureModal } from '@/components/camera/camera-capture-modal';

interface MessageInputProps {
  onSendMessage: (text: string, imageDataUri?: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [messageText, setMessageText] = useState('');
  const [selectedImageDataUri, setSelectedImageDataUri] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageDataUri(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (messageText.trim() || selectedImageDataUri) {
      onSendMessage(messageText.trim(), selectedImageDataUri || undefined);
      setMessageText('');
      setSelectedImageDataUri(null);
    }
  };

  const handlePhotoCaptured = (imageDataUri: string) => {
    setSelectedImageDataUri(imageDataUri);
    setIsCameraModalOpen(false);
  };

  return (
    <div className="border-t border-border p-4 md:p-6 bg-background">
      {selectedImageDataUri && (
        <div className="mb-2 relative w-24 h-24 border rounded-md p-1">
          <Image src={selectedImageDataUri} alt="Selected preview" layout="fill" objectFit="cover" className="rounded"/>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
            onClick={handleRemoveImage}
            aria-label="Remove image"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-accent/50"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label="Attach image"
        >
            <Paperclip className="h-5 w-5 text-muted-foreground"/>
        </Button>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={disabled}
        />
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-accent/50"
            onClick={() => setIsCameraModalOpen(true)}
            disabled={disabled}
            aria-label="Open camera"
        >
            <CameraIcon className="h-5 w-5 text-muted-foreground"/>
        </Button>
        <Input
          type="text"
          placeholder="Type a message or describe image..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-grow bg-input placeholder:text-muted-foreground rounded-full px-4"
          disabled={disabled}
          aria-label="Message input"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full bg-primary hover:bg-primary/90" 
          disabled={disabled || (!messageText.trim() && !selectedImageDataUri)} 
          aria-label="Send message"
        >
          <Send className="h-5 w-5 text-primary-foreground" />
        </Button>
      </form>
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />
    </div>
  );
}
