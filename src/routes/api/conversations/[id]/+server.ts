import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { conversations, messages } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const [convo] = await db
		.select()
		.from(conversations)
		.where(and(eq(conversations.id, params.id), eq(conversations.userId, session.user.id)))
		.limit(1);

	if (!convo) throw error(404, 'Conversation not found');

	const msgs = await db
		.select()
		.from(messages)
		.where(eq(messages.conversationId, params.id))
		.orderBy(messages.createdAt);

	return json({ conversation: convo, messages: msgs });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { title } = await request.json();

	await db
		.update(conversations)
		.set({ title, updatedAt: new Date() })
		.where(and(eq(conversations.id, params.id), eq(conversations.userId, session.user.id)));

	return json({ success: true });
};
