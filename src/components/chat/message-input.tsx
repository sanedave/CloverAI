
'use client';

import { useState, type FormEvent, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, XCircle, Camera as CameraIcon } from 'lucide-react';
import Image from 'next/image'; // For previewing image
import { CameraCaptureModal } from '@/components/camera/camera-capture-modal';
import { useToast } from '@/hooks/use-toast';

const MAX_IMAGES = 3;

interface MessageInputProps {
  onSendMessage: (text: string, imageDataUris?: string[]) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [messageText, setMessageText] = useState('');
  const [selectedImageDataUris, setSelectedImageDataUris] = useState<string[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const currentImageCount = selectedImageDataUris.length;
      const filesToProcess = Array.from(files).slice(0, MAX_IMAGES - currentImageCount);

      if (files.length > filesToProcess.length) {
        toast({
          title: 'Image Limit Reached',
          description: `You can only select up to ${MAX_IMAGES} images in total. Some images were not added.`,
          variant: 'destructive',
        });
      }

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImageDataUris(prevUris => [...prevUris, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImageDataUris(prevUris => prevUris.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (messageText.trim() || selectedImageDataUris.length > 0) {
      onSendMessage(messageText.trim(), selectedImageDataUris.length > 0 ? selectedImageDataUris : undefined);
      setMessageText('');
      setSelectedImageDataUris([]);
    }
  };

  const handlePhotoCaptured = (imageDataUri: string) => {
    if (selectedImageDataUris.length < MAX_IMAGES) {
      setSelectedImageDataUris(prevUris => [...prevUris, imageDataUri]);
      setIsCameraModalOpen(false);
    } else {
       toast({
        title: 'Image Limit Reached',
        description: `You can only select up to ${MAX_IMAGES} images. Photo not added.`,
        variant: 'destructive',
      });
      setIsCameraModalOpen(false); // Still close modal
    }
  };

  const canAddMoreImages = selectedImageDataUris.length < MAX_IMAGES;

  return (
    <div className="border-t border-border p-4 md:p-6 bg-transparent">
      {selectedImageDataUris.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedImageDataUris.map((uri, index) => (
            <div key={index} className="relative w-20 h-20 border rounded-md p-1">
              <Image src={uri} alt={`Selected preview ${index + 1}`} layout="fill" objectFit="cover" className="rounded"/>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 p-0"
                onClick={() => handleRemoveImage(index)}
                aria-label={`Remove image ${index + 1}`}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-accent/50"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || !canAddMoreImages}
            aria-label="Attach image"
            title={!canAddMoreImages ? `Maximum ${MAX_IMAGES} images allowed` : "Attach image"}
        >
            <Paperclip className="h-5 w-5 text-muted-foreground"/>
        </Button>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple // Allow multiple file selection
            className="hidden"
            disabled={disabled || !canAddMoreImages}
        />
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-accent/50"
            onClick={() => setIsCameraModalOpen(true)}
            disabled={disabled || !canAddMoreImages}
            aria-label="Open camera"
            title={!canAddMoreImages ? `Maximum ${MAX_IMAGES} images allowed` : "Open camera"}
        >
            <CameraIcon className="h-5 w-5 text-muted-foreground"/>
        </Button>
        <Input
          type="text"
          placeholder="Type a message or describe image(s)..."
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
          disabled={disabled || (!messageText.trim() && selectedImageDataUris.length === 0)} 
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
