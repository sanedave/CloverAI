import type { Participant } from '@/types/chat';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUser: Participant | undefined;
}

export function ParticipantsPanel({ participants, currentUser }: ParticipantsPanelProps) {
  return (
    <Card className="w-full md:w-80 lg:w-96 border-l-0 md:border-l rounded-none md:rounded-lg shadow-none md:shadow-sm h-full flex flex-col bg-card">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Participants
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {participants.map((participant) => (
              <li key={participant.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.avatarUrl} alt={participant.name} data-ai-hint="profile person" />
                    <AvatarFallback>
                      <UserCircle className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {participant.name}
                      {participant.id === currentUser?.id && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                    </p>
                    {participant.status && (
                       <p className={`text-xs ${participant.status === 'online' ? 'text-green-500' : 'text-muted-foreground'}`}>
                         {participant.status}
                       </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
             {participants.length === 0 && (
              <li className="p-4 text-center text-muted-foreground">No other participants.</li>
            )}
          </ul>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
