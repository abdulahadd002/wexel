import OpenAI from 'openai';
import { config } from '../config/env';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface ExtractedBillData {
  total?: number;
  date?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price?: number;
  }>;
  [key: string]: any;
}

export async function extractBillData(imageUrl: string): Promise<ExtractedBillData> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting information from handwritten bills and receipts.
You can read both English and Urdu handwriting.

Your task is to analyze the image and extract ALL fields present on the bill.
Return the data as a JSON object with the following guidelines:

1. Always try to find and include a "total" field with the total amount as a number
2. Always try to find and include a "date" field if present
3. Extract "items" as an array if there are line items, each with name, quantity, and price if available
4. Include ANY other fields you can identify (vendor name, address, invoice number, tax, etc.)
5. Use descriptive field names in camelCase
6. Convert all monetary values to numbers (not strings)
7. If you can't read something clearly, make your best attempt and include it

Return ONLY valid JSON, no markdown or explanation.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Please extract all information from this handwritten bill/receipt. Return the data as JSON.',
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const extractedData = JSON.parse(jsonMatch[0]) as ExtractedBillData;

    return extractedData;
  } catch (error) {
    console.error('Error extracting bill data:', error);

    if (error instanceof Error) {
      throw new Error(`Failed to extract bill data: ${error.message}`);
    }

    throw new Error('Failed to extract bill data');
  }
}

export async function reprocessBillWithPrompt(
  imageUrl: string,
  additionalPrompt: string
): Promise<ExtractedBillData> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting information from handwritten bills and receipts.
You can read both English and Urdu handwriting.
${additionalPrompt}
Return ONLY valid JSON, no markdown or explanation.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Please extract the requested information from this handwritten bill/receipt.',
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    return JSON.parse(jsonMatch[0]) as ExtractedBillData;
  } catch (error) {
    console.error('Error reprocessing bill:', error);
    throw new Error('Failed to reprocess bill');
  }
}
