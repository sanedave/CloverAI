
'use server';
/**
 * @fileOverview An AI chat assistant flow.
 * This flow powers an AI assistant that can respond to user messages in the chat,
 * including generating or processing images when requested/provided.
 *
 * - chatAssistant - A function that invokes the chat assistant.
 * - ChatAssistantInput - The input type for the chatAssistant function.
 * - ChatAssistantOutput - The return type for the chatAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAssistantInputSchema = z.object({
  userInput: z.string().describe('The message text from the user.'),
  inputImageDataUris: z.array(z.string()).optional().describe("Optional images provided by the user, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

const ChatAssistantOutputSchema = z.object({
  assistantResponse: z.string().optional().describe("The AI assistant's text response to the user, or a confirmation/status message if an image is being generated/processed."),
  imageUrl: z.string().optional().describe("URL of the generated/processed image, as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
  isImageResponse: z.boolean().describe("True if the response primarily contains an image, false otherwise.")
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

// Schema for the prompt's internal decision-making
const PromptDecisionSchema = z.object({
  action: z.enum(['generateText', 'generateImage', 'processImageText']).describe("The action to take: 'generateText' for a textual response, 'generateImage' to create/modify an image, 'processImageText' to describe or answer questions about a provided image(s)."),
  textResponse: z.string().optional().describe("The text response if action is 'generateText' or 'processImageText'. If action is 'generateImage', this should be a status like 'Image generation' or 'Image modification'."),
  imageGenerationPrompt: z.string().optional().describe("The prompt for image generation/modification if action is 'generateImage'. This should be the core subject/description for the image or the modification instruction.")
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
User message: "{{{userInput}}}"
{{#if inputImageDataUris}}
The user has also provided the following image(s):
{{#each inputImageDataUris}}
Image {{@index}}: {{media url=this}}
{{/each}}

Your task is to analyze the user's message, and the provided image(s), to determine the appropriate action.

Consider the following scenarios:

1.  **Image Generation (New or Based on Provided Image(s)):**
    *   If the user asks to generate a new image, create a drawing, make a picture, or a similar request for visual content (e.g., "generate an image of a cat", "draw a sunset"), AND no image was provided by the user OR they explicitly ask for a NEW image ignoring any provided one(s):
        Set 'action' to 'generateImage'. Extract the core subject for the image into 'imageGenerationPrompt'. For 'textResponse', set it to "Image generation".
    *   If the user HAS PROVIDED image(s) AND their message asks to RE-GENERATE, EDIT, or MODIFY one or more of them (e.g., "re-generate this", "make the first cat blue", "add a hat to the person in the second image", "change the background of these images to a beach"):
        Set 'action' to 'generateImage'. The 'imageGenerationPrompt' should be the user's textual instruction for the modification (e.g., "make the first cat blue and add a hat"). For 'textResponse', set it to "Image modification". The provided image(s) will be used as primary context. If multiple images are provided, assume the instruction applies to the first one unless specified otherwise, or try to combine them if the request implies it (e.g., "combine these into one scene").

2.  **Image Understanding/Description (Text Response about Provided Image(s)):**
    *   If the user HAS PROVIDED image(s) AND asks a question about them, wants them described, or seeks information from them (e.g., "what is in these pictures?", "describe the images", "can you identify this plant?"):
        Set 'action' to 'processImageText'. Formulate a helpful text response answering the question or describing the image(s) in 'textResponse'.

3.  **General Text Conversation:**
    *   If the user's message is a question, a statement, or any other conversational input not falling into the above image-related categories (even if image(s) were provided but the text doesn't refer to them for processing/generation):
        Set 'action' to 'generateText'. Formulate a helpful, concise, and natural text response in 'textResponse'.

Your responses should be appropriate for a chat context.
Ensure the 'imageGenerationPrompt' is suitable for an image generation model if 'action' is 'generateImage'.
If you are unsure, default to 'generateText'.
{{else}}
Your task is to analyze the user's message to determine the appropriate action.
- If the user is asking to generate an image, create a drawing, make a picture, or a similar request for visual content (e.g., "generate an image of a cat", "draw a sunset", "show me a picture of a dog"):
    Set 'action' to 'generateImage'. Extract the core subject for the image into 'imageGenerationPrompt'. For 'textResponse', set it to "Image generation".
- Otherwise (general text query):
    Set 'action' to 'generateText'. Formulate a helpful, concise, and natural text response in 'textResponse'.
Ensure the 'imageGenerationPrompt' is suitable for an image generation model if 'action' is 'generateImage'.
If you are unsure, default to 'generateText'.
{{/if}}
Do not start your response by repeating "The user said..." or "User message:". Just respond naturally.`,
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
        const generationPromptParts: any[] = [];
        
        if (input.inputImageDataUris && input.inputImageDataUris.length > 0) {
          input.inputImageDataUris.forEach(uri => {
            generationPromptParts.push({ media: { url: uri } });
          });
        }
        generationPromptParts.push({ text: decisionOutput.imageGenerationPrompt });
        
        const modelToUse = 'googleai/gemini-2.0-flash-exp';

        const {media} = await ai.generate({
          model: modelToUse, 
          prompt: generationPromptParts,
          config: {
            responseModalities: ['TEXT', 'IMAGE'], 
          },
        });

        if (media && media.url) {
          return {
            assistantResponse: decisionOutput.textResponse || "Image generation",
            imageUrl: media.url, 
            isImageResponse: true,
          };
        } else {
          return { assistantResponse: "Sorry, I couldn't generate/modify the image this time. The model didn't provide an image.", isImageResponse: false };
        }
      } catch (error) {
        console.error("Image generation/modification error:", error);
        return { assistantResponse: "I ran into an issue trying to process that image request. Please try a different prompt.", isImageResponse: false };
      }
    } else if (decisionOutput.action === 'processImageText') {
        return {
            assistantResponse: decisionOutput.textResponse || "I've processed the image(s) you sent. What would you like to know?",
            isImageResponse: false, 
        };
    }
    else { // 'generateText' or fallback
      return {
        assistantResponse: decisionOutput.textResponse || "I'm not sure how to respond to that.",
        isImageResponse: false,
      };
    }
  }
);
