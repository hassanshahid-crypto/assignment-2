import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents, chunks, embeddings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
	const result: string[] = [];
	let start = 0;
	while (start < text.length) {
		const end = Math.min(start + chunkSize, text.length);
		result.push(text.slice(start, end));
		start += chunkSize - overlap;
	}
	return result;
}

async function getEmbedding(text: string): Promise<number[]> {
	const url = env.EMBEDDING_API_URL || 'http://localhost:8000';
	const res = await fetch(`${url}/embed`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text })
	});
	if (!res.ok) throw new Error('Embedding API failed');
	const data = await res.json();
	return data.embedding;
}

async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
	const url = env.EMBEDDING_API_URL || 'http://localhost:8000';
	const res = await fetch(`${url}/embed-batch`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ texts })
	});
	if (!res.ok) throw new Error('Embedding API failed');
	const data = await res.json();
	return data.embeddings;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const formData = await request.formData();
	const file = formData.get('file') as File;

	if (!file) throw error(400, 'No file provided');

	const allowedTypes = ['text/plain', 'text/markdown', 'text/csv', 'application/pdf'];
	if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
		throw error(400, 'Only text files are supported');
	}

	const content = await file.text();
	if (!content.trim()) throw error(400, 'File is empty');

	// Create document
	const [doc] = await db
		.insert(documents)
		.values({
			name: file.name,
			type: file.name.endsWith('.pdf') ? 'pdf' : 'text',
			content,
			uploadedBy: session.user.id
		})
		.returning();

	// Chunk the content
	const textChunks = chunkText(content);

	// Get embeddings in batch
	const embeddingVectors = await getEmbeddingsBatch(textChunks);

	// Insert chunks and embeddings
	for (let i = 0; i < textChunks.length; i++) {
		const [chunk] = await db
			.insert(chunks)
			.values({
				documentId: doc.id,
				content: textChunks[i],
				chunkIndex: i
			})
			.returning();

		await db.insert(embeddings).values({
			chunkId: chunk.id,
			embedding: embeddingVectors[i]
		});
	}

	return json({
		success: true,
		document: { id: doc.id, name: doc.name, chunks: textChunks.length }
	});
};

export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const docs = await db
		.select({
			id: documents.id,
			name: documents.name,
			type: documents.type,
			createdAt: documents.createdAt
		})
		.from(documents)
		.where(eq(documents.uploadedBy, session.user.id))
		.orderBy(documents.createdAt);

	return json({ documents: docs });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { documentId } = await request.json();
	if (!documentId) throw error(400, 'Document ID required');

	await db.delete(documents).where(eq(documents.id, documentId));

	return json({ success: true });
};
