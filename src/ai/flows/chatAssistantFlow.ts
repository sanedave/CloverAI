
'use server';
/**
 * @fileOverview An AI chat assistant flow.
 * This flow powers an AI assistant that can respond to user messages in the chat,
 * including generating images when requested.
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
  assistantResponse: z.string().optional().describe("The AI assistant's text response to the user, or a confirmation/status message if an image is being generated."),
  imageUrl: z.string().optional().describe("URL of the generated image, as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
  isImageResponse: z.boolean().describe("True if the response primarily contains an image, false otherwise.")
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

// Schema for the prompt's internal decision-making
const PromptDecisionSchema = z.object({
  action: z.enum(['generateText', 'generateImage']).describe("The action to take based on user input: 'generateText' for a textual response, or 'generateImage' to create an image."),
  textResponse: z.string().optional().describe("The text response if action is 'generateText'. If action is 'generateImage', this can be a short confirmation message (e.g., 'Sure, generating an image of a cat...')."),
  imageGenerationPrompt: z.string().optional().describe("The prompt for image generation if action is 'generateImage'. This should be the core subject/description for the image.")
});

export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  const result = await assistantFlow(input);
  if (!result) {
    return { assistantResponse: "I'm sorry, I couldn't process that request.", isImageResponse: false };
  }
  return result;
}

const assistantPrompt = ai.definePrompt({
  name: 'chatAssistantDecisionPrompt',
  input: {schema: ChatAssistantInputSchema},
  output: {schema: PromptDecisionSchema},
  prompt: `You are a friendly and helpful AI assistant named 'AI Assistant' in a chat application.
The user sent the following message: "{{{userInput}}}"

Analyze the user's message carefully.
- If the user is asking to generate an image, create a drawing, make a picture, or a similar request for visual content (e.g., "generate an image of a cat", "draw a sunset", "show me a picture of a dog", "can you make a picture of a spaceship?"), set 'action' to 'generateImage'. Extract the core subject for the image into 'imageGenerationPrompt'. For 'textResponse', provide a brief confirmation like "Okay, I'll generate an image of [subject]..." or "Sure, creating a picture of [subject] for you...".
- Otherwise, if the user's message is a question, a statement, or any other conversational input not requesting an image, set 'action' to 'generateText'. Formulate a helpful, concise, and natural text response in 'textResponse'.

Your responses should be appropriate for a chat context.
Do not start your response by repeating "The user said..." or "User message:". Just respond naturally.
Ensure the 'imageGenerationPrompt' is suitable for an image generation model if 'action' is 'generateImage'.
If you are unsure, default to 'generateText'.`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: ChatAssistantInputSchema,
    outputSchema: ChatAssistantOutputSchema,
  },
  async (input) => {
    const {output: decisionOutput} = await assistantPrompt(input);

    if (!decisionOutput) {
      return { assistantResponse: "Sorry, I had trouble understanding that.", isImageResponse: false };
    }

    if (decisionOutput.action === 'generateImage' && decisionOutput.imageGenerationPrompt) {
      try {
        const {media} = await ai.generate({
          model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Use this model for image generation
          prompt: decisionOutput.imageGenerationPrompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'], // Must include both
          },
        });
        if (media && media.url) {
          return {
            assistantResponse: decisionOutput.textResponse || "Here's the image you requested!",
            imageUrl: media.url, // This will be a data URI
            isImageResponse: true,
          };
        } else {
          return { assistantResponse: "Sorry, I couldn't generate the image this time. The model didn't provide an image.", isImageResponse: false };
        }
      } catch (error) {
        console.error("Image generation error:", error);
        return { assistantResponse: "I ran into an issue trying to generate that image. Please try a different prompt.", isImageResponse: false };
      }
    } else {
      // Default to text response or if image prompt was missing
      return {
        assistantResponse: decisionOutput.textResponse || "I'm not sure how to respond to that.",
        isImageResponse: false,
      };
    }
  }
);
