
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

**Overall Response Guidelines for 'textResponse' (applicable when 'action' is 'generateText' or 'processImageText'):**
1.  **Detailed Explanations**: When answering general questions or explaining topics, be thorough and provide insightful points. Break down information into clear, digestible sections. Use examples or analogies if they aid understanding. Maintain an engaging and helpful tone throughout.
2.  **Essay/Article Generation**: If the user explicitly asks you to "write an essay", "compose an article", "create a report", or requests similar long-form structured text on a specific topic (e.g., "write an essay about the future of renewable energy", "compose an article detailing the benefits of regular exercise"):
    *   The 'textResponse' should be a well-structured piece.
    *   Include a clear title at the beginning.
    *   Use Markdown-style headers for sections (e.g., \`## Introduction\`, \`### Sub-point\`).
    *   Develop a coherent body of text that comprehensively addresses the topic with wonderful, detailed points.
    *   Include a concluding paragraph or summary.
    *   End the entire response with the signature: "Sincerely, AI Assistant".
    *   For these requests, the usual emphasis on chat conciseness is relaxed to allow for full topic coverage.
3.  **General Chat**: For other conversational interactions, questions, or statements not covered above, provide helpful, natural, detailed, and reasonably concise text responses with good, wonderful points.

{{#if inputImageDataUris}}
The user has also provided the following image(s):
{{#each inputImageDataUris}}
Image {{@index}}: {{media url=this}}
{{/each}}

Your task is to analyze the user's message, AND the provided image(s), to determine the appropriate action and formulate a response. Populate the 'action', 'textResponse', and 'imageGenerationPrompt' fields according to the rules below, keeping the **Overall Response Guidelines for 'textResponse'** in mind.

Consider the following scenarios:
1.  **Image Re-generation/Editing/Modification:**
    *   If the user's message asks to RE-GENERATE, EDIT, or MODIFY one or more of the provided images (e.g., "re-generate this", "make the first cat blue and wearing a hat", "change the background of these images to a beach", "combine these into one scene with a spaceship"):
        Set 'action' to 'generateImage'.
        The 'imageGenerationPrompt' should be the user's textual instruction for the modification (e.g., "make the first cat blue and add a hat").
        For 'textResponse', set it to "Image modification".
        The provided image(s) will be used as primary context for the generation.

2.  **Image Understanding/Description (Text response about provided images):**
    *   If the user HAS PROVIDED image(s) AND asks a question about them, wants them described, or seeks information from them (e.g., "what is in these pictures?", "describe the images for me", "can you identify this plant based on the photo?"):
        Set 'action' to 'processImageText'.
        Formulate a 'textResponse' by applying the 'Detailed Explanations' guideline from the **Overall Response Guidelines for 'textResponse'** to the content of the image(s).

3.  **Image Generation (New Image, ignoring provided ones) OR General Text/Essay (with images present but not the focus for modification/understanding):**
    *   If the user asks to generate a COMPLETELY NEW image (e.g., "generate an image of a dog", "draw a sunset over mountains") and explicitly or implicitly indicates any provided images should be ignored for this new generation:
        Set 'action' to 'generateImage'.
        Extract the core subject for the new image into 'imageGenerationPrompt'.
        For 'textResponse', set it to "Image generation".
    *   Otherwise, if the message is a general text query, a request for an essay, or any other conversational input that doesn't fit image modification or direct image understanding:
        Set 'action' to 'generateText'.
        Formulate the 'textResponse' based on the user's query, adhering to the **Overall Response Guidelines for 'textResponse'**. The presence of images might be incidental or contextual for the text but not the direct subject of processing for this action.

{{else}}
Your task is to analyze the user's message to determine the appropriate action and formulate a response. Populate the 'action', 'textResponse', and 'imageGenerationPrompt' fields according to the rules below, keeping the **Overall Response Guidelines for 'textResponse'** in mind.

Consider the following scenarios:
1.  **New Image Generation:**
    *   If the user is asking to generate an image, create a drawing, make a picture, or a similar request for visual content (e.g., "generate an image of a cat", "draw a sunset", "show me a picture of a dog"):
        Set 'action' to 'generateImage'.
        Extract the core subject for the image into 'imageGenerationPrompt'.
        For 'textResponse', set it to "Image generation".

2.  **General Text Conversation / Essay Generation:**
    *   For any other user message (questions, statements, requests for essays, etc.):
        Set 'action' to 'generateText'.
        Formulate the 'textResponse' based on the user's query, adhering to the **Overall Response Guidelines for 'textResponse'**.
{{/if}}

**General Rules for Field Population:**
*   Ensure the 'imageGenerationPrompt' is suitable for an image generation model if 'action' is 'generateImage'.
*   If unsure about the user's intent, default to 'action: generateText' and provide a general helpful response based on the text input, following the **Overall Response Guidelines for 'textResponse'**.
*   Do not start your response by repeating "The user said..." or "User message:". Just respond naturally.
*   If an essay is generated, ensure all parts (title, headers, body, conclusion, signature) are within the single 'textResponse' field.
`,
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
