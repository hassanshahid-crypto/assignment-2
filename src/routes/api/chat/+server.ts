import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();

	if (!session?.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { messages } = await request.json();

	const google = createGoogleGenerativeAI({
		apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY
	});

	const result = streamText({
		model: google('gemini-2.5-flash'),
		messages: await convertToModelMessages(messages)
	});

	return result.toUIMessageStreamResponse();
};
