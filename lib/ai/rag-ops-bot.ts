import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client for vector search (needs service role usually, but we'll use passed client or RLS)
// Note: Vector search often requires calling a stored procedure or using a client with vector support
// We'll assume the standard supabase-js client works with the vector extension if queries are constructed correctly

export interface RAGResponse {
  answer: string;
  sources: {
    documentName: string;
    text: string;
    similarity: number;
  }[];
}

// 1. Generate Embeddings
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  });
  return response.data[0].embedding;
}

// 2. Search Documents
export async function searchDocuments(
  supabase: any,
  query: string,
  eventId: string,
  limit: number = 3
) {
  const queryEmbedding = await generateEmbedding(query);

  // Perform vector similarity search
  // We need a remote procedure call (RPC) for this usually, as Supabase JS doesn't support vector syntax directly in .select() yet
  // or we use a raw SQL query via RPC if we set one up.
  // For this implementation, I'll assume we have an RPC function `match_documents`
  // If not, we'll need to create it in the migration.

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: limit,
    filter_event_id: eventId
  });

  if (error) {
    console.error('Vector search error:', error);
    return [];
  }

  return data;
}

// 3. Generate Answer
export async function answerQuestion(
  supabase: any,
  question: string,
  eventId: string,
  providerName: string
): Promise<RAGResponse> {
  // Search for context
  const chunks = await searchDocuments(supabase, question, eventId);

  if (!chunks || chunks.length === 0) {
    return {
      answer: "I couldn't find any specific information about that in the briefing documents. Please check with an Admin.",
      sources: []
    };
  }

  // Build context string
  const contextText = chunks.map((c: any) => 
    `Source: ${c.document_name}\nContent: ${c.chunk_text}`
  ).join('\n\n');

  // Generate answer
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are "Ops Bot", a helpful assistant for event staff. 
        Answer the provider's question based ONLY on the provided briefing document context. 
        If the answer is not in the context, say you don't know. 
        Keep answers concise and professional.
        Address the provider as ${providerName}.`
      },
      {
        role: "user",
        content: `Context:\n${contextText}\n\nQuestion: ${question}`
      }
    ]
  });

  const answer = completion.choices[0].message.content || "I couldn't generate an answer.";

  return {
    answer,
    sources: chunks.map((c: any) => ({
      documentName: c.document_name,
      text: c.chunk_text,
      similarity: c.similarity
    }))
  };
}

// 4. Document Processing (Splitting and Embedding)
// This would be called when a document is uploaded
export async function processDocumentAndEmbed(
  supabase: any,
  documentId: string,
  text: string
) {
  // Split text into chunks (simple paragraph/sentence splitting)
  const chunks = splitTextIntoChunks(text, 1000); // ~1000 characters

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);

    await supabase.from('document_embeddings').insert({
      document_id: documentId,
      chunk_text: chunk,
      chunk_index: i,
      embedding: embedding
    });
  }
}

function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  const sentences = text.split(/(?<=[.?!])\s+/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += (currentChunk ? ' ' : '') + sentence;
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}



