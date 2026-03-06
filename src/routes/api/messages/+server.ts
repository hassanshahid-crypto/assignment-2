import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, conversations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { conversationId, parentId, role, content, citations, branchIndex } = await request.json();

	if (!conversationId || !role || !content) {
		throw error(400, 'conversationId, role, and content are required');
	}

	const [msg] = await db
		.insert(messages)
		.values({
			conversationId,
			parentId: parentId || null,
			role,
			content,
			citations: citations ? JSON.stringify(citations) : null,
			branchIndex: branchIndex ?? 0
		})
		.returning();

	// Update conversation timestamp
	await db
		.update(conversations)
		.set({ updatedAt: new Date() })
		.where(eq(conversations.id, conversationId));

	return json({ message: msg });
};

// Get children of a message (for branch navigation)
export const GET: RequestHandler = async ({ url, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const parentId = url.searchParams.get('parentId');
	const conversationId = url.searchParams.get('conversationId');

	if (!conversationId) throw error(400, 'conversationId required');

	let condition;
	if (parentId) {
		condition = and(
			eq(messages.conversationId, conversationId),
			eq(messages.parentId, parentId)
		);
	} else {
		// Root messages (no parent)
		const allMsgs = await db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, conversationId))
			.orderBy(messages.createdAt);

		const roots = allMsgs.filter((m) => !m.parentId);
		return json({ messages: roots });
	}

	const children = await db
		.select()
		.from(messages)
		.where(condition)
		.orderBy(messages.createdAt);

	return json({ messages: children });
};
