
'use server';
/**
 * @fileOverview An AI chat assistant flow.
 * This flow powers an AI assistant that can respond to user messages in the chat.
 *
 * - chatAssistant - A function that invokes the chat assistant.
 * - ChatAssistantInput - The input type for the chatAssistant function.
 * - ChatAssistantOutput - The return type for the chatAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAssistantInputSchema = z.object({
  userInput: z.string().describe('The message text from the user.'),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

const ChatAssistantOutputSchema = z.object({
  assistantResponse: z.string().describe("The AI assistant's response to the user."),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  // Make sure to handle potential null output from the prompt if the model fails
  // or doesn't conform to the schema, though Genkit tries to enforce this.
  const result = await assistantFlow(input);
  if (!result?.assistantResponse) {
    return { assistantResponse: "I'm sorry, I couldn't process that request." };
  }
  return result;
}

const assistantPrompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  input: {schema: ChatAssistantInputSchema},
  output: {schema: ChatAssistantOutputSchema},
  prompt: `You are a friendly and helpful AI assistant named 'AI Assistant' in a chat application.
The user sent the following message: "{{{userInput}}}"
Respond to the user's message in a conversational, helpful, and concise manner. Your responses should be appropriate for a chat context.
Do not start your response by repeating "The user said..." or "User message:". Just respond naturally.`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: ChatAssistantInputSchema,
    outputSchema: ChatAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await assistantPrompt(input);
    // If output is null or doesn't conform, Genkit might return null.
    // The wrapper function `chatAssistant` handles this null case.
    return output!;
  }
);
