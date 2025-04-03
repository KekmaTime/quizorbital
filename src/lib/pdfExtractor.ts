/**
 * Extracts text from a PDF file using GPT-4o's vision capabilities
 * This implementation first converts PDF pages to images, then sends them to GPT-4o
 * 
 * @param file The PDF file to extract text from
 * @returns Promise with the extracted text
 */
import { openai } from "./openai";
import * as pdfjs from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';

// Set the PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("Extracting text from PDF using GPT-4o vision:", file.name);
    
    // Convert the PDF file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    
    // Get PDF info
    const numPages = pdf.numPages;
    console.log(`PDF has ${numPages} pages`);
    
    // Limit the number of pages to process to avoid API limits
    const MAX_PAGES = 20; 
    const pagesToProcess = Math.min(numPages, MAX_PAGES);
    
    if (numPages > MAX_PAGES) {
      console.warn(`PDF has more than ${MAX_PAGES} pages. Only the first ${MAX_PAGES} pages will be processed.`);
    }
    
    // Process each page and collect text
    let allExtractedText = '';
    
    for (let i = 1; i <= pagesToProcess; i++) {
      try {
        console.log(`Processing page ${i} of ${pagesToProcess}`);
        const pageText = await extractTextFromPage(pdf, i);
        allExtractedText += pageText + '\n\n';
      } catch (error) {
        console.error(`Error processing page ${i}:`, error);
        // Continue with next page
      }
    }
    
    // Add a reminder to ignore PDF metadata
    return `${allExtractedText.trim()}
    
IMPORTANT NOTE: The content above is purely educational material. Any metadata about PDF format, encoding, or document structure should be completely ignored when generating quiz questions.`;
  } catch (error: any) {
    console.error("Error extracting text from PDF with GPT-4o vision:", error);
    
    // Fallback for errors
    if (error.message?.includes("This model's maximum context length")) {
      return "The PDF is too large to process. Please try a smaller PDF or a text file instead.";
    }
    
    return "Error extracting PDF content. Please try a different file.";
  }
}

/**
 * Extracts text from a single PDF page
 * @param pdf PDF document
 * @param pageNum Page number (1-based)
 * @returns Promise with the extracted text
 */
async function extractTextFromPage(pdf: PDFDocumentProxy, pageNum: number): Promise<string> {
  // Get the page
  const page = await pdf.getPage(pageNum);
  
  // Get the viewport
  const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better resolution
  
  // Create a canvas to render the page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  // Render the page
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  // Convert the canvas to a data URL
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  
  // Convert data URL to base64
  const base64Image = dataUrl.split(',')[1];
  
  // Call GPT-4o with vision capabilities
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert PDF content extractor. Extract ALL text content from the provided PDF page image.
        Focus ONLY on extracting the actual educational/informational content.
        Completely ignore and DO NOT mention any PDF metadata, formatting, headers/footers, page numbers, or technical document properties.
        Format the output as clean plain text with proper paragraph breaks.
        If you see tables, format them in a readable text form.
        Preserve bullet points and numbered lists where present.
        Do not describe the PDF or include notes about the extraction process.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Extract all educational/informational content from this PDF page (page ${pageNum}). Ignore all metadata, formatting details and document properties.` },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ]
  });

  return response.choices[0].message.content || "";
}

/**
 * Converts a file to base64 string
 * @param file File to convert
 * @returns Promise with base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extract the base64 part (remove the data URL prefix)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
} 