import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { chunks, embeddings, documents } from '$lib/server/db/schema';
import { sql, eq } from 'drizzle-orm';

async function getQueryEmbedding(text: string): Promise<number[]> {
	const url = env.EMBEDDING_API_URL || 'http://localhost:8000';
	const res = await fetch(`${url}/embed`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text })
	});
	if (!res.ok) return [];
	const data = await res.json();
	return data.embedding;
}

async function retrieveContext(query: string): Promise<{ content: string; documentName: string; chunkIndex: number }[]> {
	try {
		const queryEmbedding = await getQueryEmbedding(query);
		if (!queryEmbedding.length) return [];

		const vectorStr = `[${queryEmbedding.join(',')}]`;

		const results = await db.execute(sql`
			SELECT c.content, c.chunk_index, d.name as document_name,
				   e.embedding <=> ${vectorStr}::vector AS distance
			FROM embeddings e
			JOIN chunks c ON e.chunk_id = c.id
			JOIN documents d ON c.document_id = d.id
			ORDER BY e.embedding <=> ${vectorStr}::vector
			LIMIT 5
		`);

		return (results.rows as any[]).map((r) => ({
			content: r.content,
			documentName: r.document_name,
			chunkIndex: r.chunk_index
		}));
	} catch {
		return [];
	}
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();

	if (!session?.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { messages } = await request.json();

	const google = createGoogleGenerativeAI({
		apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY
	});

	// Get the latest user message for RAG retrieval
	const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
	let systemPrompt = 'You are a helpful AI assistant. Format your responses using Markdown when appropriate. Use code fences with language identifiers for code blocks.';
	let citations: { content: string; documentName: string; chunkIndex: number }[] = [];

	if (lastUserMessage) {
		const userText =
			typeof lastUserMessage.content === 'string'
				? lastUserMessage.content
				: lastUserMessage.content
						?.filter((p: any) => p.type === 'text')
						.map((p: any) => p.text)
						.join('') || '';

		citations = await retrieveContext(userText);

		if (citations.length > 0) {
			const contextBlocks = citations
				.map(
					(c, i) =>
						`[Source ${i + 1}: ${c.documentName} (chunk ${c.chunkIndex + 1})]\n${c.content}`
				)
				.join('\n\n');

			systemPrompt = `You are a helpful AI assistant with access to the user's documents. Use the following retrieved context to answer the user's question. If the context is relevant, cite your sources using [Source N] notation. If the context is not relevant to the question, answer based on your general knowledge and mention that the answer is not from the uploaded documents.

Format your responses using Markdown. Use code fences with language identifiers for code blocks.

--- Retrieved Context ---
${contextBlocks}
--- End Context ---`;
		}
	}

	const result = streamText({
		model: google('gemini-2.5-flash'),
		system: systemPrompt,
		messages
	});

	const response = result.toDataStreamResponse();

	// Add citations as a custom header
	if (citations.length > 0) {
		const citationData = citations.map((c, i) => ({
			index: i + 1,
			documentName: c.documentName,
			chunkIndex: c.chunkIndex + 1,
			preview: c.content.slice(0, 100) + '...'
		}));
		response.headers.set('X-Citations', JSON.stringify(citationData));
	}

	return response;
};
