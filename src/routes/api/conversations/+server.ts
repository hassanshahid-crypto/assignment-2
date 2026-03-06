import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { conversations, messages } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const convos = await db
		.select({
			id: conversations.id,
			title: conversations.title,
			createdAt: conversations.createdAt,
			updatedAt: conversations.updatedAt
		})
		.from(conversations)
		.where(eq(conversations.userId, session.user.id))
		.orderBy(desc(conversations.updatedAt));

	return json({ conversations: convos });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { title } = await request.json().catch(() => ({ title: 'New Chat' }));

	const [convo] = await db
		.insert(conversations)
		.values({
			userId: session.user.id,
			title: title || 'New Chat'
		})
		.returning();

	return json({ conversation: convo });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { conversationId } = await request.json();
	if (!conversationId) throw error(400, 'Conversation ID required');

	await db.delete(conversations).where(eq(conversations.id, conversationId));

	return json({ success: true });
};
