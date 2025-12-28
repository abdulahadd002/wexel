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
          content: `You are an expert OCR system for reading business documents. You can read printed and handwritten text in English and Urdu.

THERE ARE TWO DOCUMENT TYPES - IDENTIFY WHICH ONE AND EXTRACT ACCORDINGLY:

=== TYPE 1: INVOICE/BILL (has "Supplier Name:", "Bill No:", "Bill Date:") ===
Extract these fields:
- "documentType": "invoice"
- "partyName": The supplier/vendor name (from "Supplier Name:" field)
- "billNo": Bill number (from "Bill No:" field, e.g., "3", "1", "#035")
- "billDate": Date (from "Bill Date:" field, format DD-MM-YY, e.g., "20-12-25")
- "items": Array of line items from the table:
  [{"item": "17MM PVC Golden", "qty": 5, "unitPrice": 10400, "amount": 52000}, ...]
- "total": Sum total before discount (number)
- "discount": Discount amount (number, default 0)
- "netTotal": Final amount after discount (number) - MOST IMPORTANT

=== TYPE 2: LEDGER/ACCOUNT STATEMENT (has "Party Name:" header with Date/Particulars/Debit/Credit/Balance columns) ===
Extract these fields:
- "documentType": "ledger"
- "partyName": The party name from the header (e.g., "Waseem Wood Kabal", "Bilal Wood Matta")
- "transactions": Array of all rows:
  [{"date": "01-12-25", "particulars": "Bill #010", "debit": 179800, "credit": 0, "balance": 179800}, ...]
- "netTotal": The final balance (last row's Balance value) or total debit if it's a single bill entry

CRITICAL RULES:
1. ALL monetary values must be NUMBERS without commas (179800 not "179,800")
2. Read EVERY row in tables - don't skip any
3. For ledger: "Bill #xxx" entries are debits, "Cash Received"/"Online Receipt"/"Cheque #xxx" are credits
4. For dates: preserve format as DD-MM-YY (e.g., "10-12-25")
5. If a cell is empty, use 0 for numbers or "" for text
6. For ledger documents, extract the DEBIT amount from bill entries as netTotal

Return ONLY valid JSON. No markdown, no explanation.`,
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
              text: `Analyze this document image carefully.

STEP 1: Determine document type
- If you see "Supplier Name:", "Bill No:", "Bill Date:" with an items table → TYPE: invoice
- If you see "Party Name:" header with Date/Particulars/Debit/Credit/Balance columns → TYPE: ledger

STEP 2: Extract ALL data according to the document type

STEP 3: Return JSON with appropriate fields

For INVOICE type, I need: partyName, billNo, billDate, items[], total, discount, netTotal
For LEDGER type, I need: partyName, transactions[], netTotal (use debit amount from bill entry)`,
            },
          ],
        },
      ],
      max_tokens: 3000,
      temperature: 0,
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
