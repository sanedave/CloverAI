
'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera as CameraIcon, SwitchCamera, VideoOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (imageDataUri: string) => void;
}

export function CameraCaptureModal({ isOpen, onClose, onPhotoCaptured }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [currentVideoInputIndex, setCurrentVideoInputIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getDevices = async () => {
      if (!isOpen) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(device => device.kind === 'videoinput');
        setVideoInputs(inputs);
        if (inputs.length === 0) {
            setHasCameraPermission(false); // No camera found
            toast({
                variant: 'destructive',
                title: 'No Camera Found',
                description: 'Could not find any camera devices.',
            });
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
         toast({
            variant: 'destructive',
            title: 'Device Error',
            description: 'Could not enumerate camera devices.',
        });
      }
    };
    getDevices();
  }, [isOpen, toast]);

  useEffect(() => {
    const startStream = async () => {
      if (!isOpen || videoInputs.length === 0) {
        if (stream) { // Clean up existing stream if modal is closed or no inputs
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if (videoRef.current) videoRef.current.srcObject = null;
        }
        return;
      }

      // Stop previous stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      try {
        const currentDeviceId = videoInputs[currentVideoInputIndex]?.deviceId;
        const constraints: MediaStreamConstraints = {
          video: currentDeviceId ? { deviceId: { exact: currentDeviceId } } : true,
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    startStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
         if (videoRef.current) videoRef.current.srcObject = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentVideoInputIndex, videoInputs, toast]); // stream is intentionally omitted to avoid re-triggering on setStream


  const handleSnapPhoto = () => {
    if (videoRef.current && canvasRef.current && stream) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageDataUri = canvas.toDataURL('image/png');
        onPhotoCaptured(imageDataUri);
      }
      setIsCapturing(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Capture Error',
            description: 'Could not capture photo. Camera stream might not be active.',
        });
    }
  };

  const handleSwitchCamera = () => {
    if (videoInputs.length > 1) {
      setCurrentVideoInputIndex((prevIndex) => (prevIndex + 1) % videoInputs.length);
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <CameraIcon className="h-5 w-5" /> Capture Photo
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0">
          <div className="relative aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted // Mute to prevent echo, user sound is not captured
            />
            {!hasCameraPermission && isOpen && ( // Show message only if modal is open and permission is denied/null
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4">
                    {hasCameraPermission === false && videoInputs.length > 0 && (
                        <Alert variant="destructive" className="w-full max-w-md">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser settings to use this feature.
                                You might need to refresh the page after granting permissions.
                            </AlertDescription>
                        </Alert>
                    )}
                    {hasCameraPermission === false && videoInputs.length === 0 && isOpen && (
                         <Alert variant="destructive" className="w-full max-w-md">
                            <VideoOff className="h-4 w-4" />
                            <AlertTitle>No Camera Detected</AlertTitle>
                            <AlertDescription>
                                We couldn't find any camera devices. Please ensure a camera is connected and enabled.
                            </AlertDescription>
                        </Alert>
                    )}
                     {hasCameraPermission === null && isOpen && ( // Still checking permission
                        <p className="text-muted-foreground">Requesting camera access...</p>
                    )}
                </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogFooter className="p-6 pt-0 sm:justify-between">
            <div>
                {videoInputs.length > 1 && hasCameraPermission && (
                    <Button variant="outline" onClick={handleSwitchCamera} disabled={!stream || isCapturing}>
                    <SwitchCamera className="mr-2 h-4 w-4" /> Switch Camera
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleSnapPhoto} disabled={!stream || !hasCameraPermission || isCapturing}>
                    {isCapturing ? 'Capturing...' : 'Snap Photo'}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
