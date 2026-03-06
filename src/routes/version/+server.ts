import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({ version: '2.0.0', name: 'sveltekit-auth-rag' });
};
