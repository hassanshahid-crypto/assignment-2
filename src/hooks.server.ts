import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from './auth';

const authorizationHandle: Handle = async ({ event, resolve }) => {
	const session = await event.locals.auth();
	const path = event.url.pathname;

	// Skip authorization for Auth.js internal routes (callbacks, signin, signout, etc.)
	// These are handled by authHandle and should not be intercepted
	if (path.startsWith('/auth/callback') || path.startsWith('/auth/signin') || path.startsWith('/auth/signout')) {
		return resolve(event);
	}

	// Protected routes: /dashboard/*
	if (path.startsWith('/dashboard')) {
		if (!session?.user) {
			throw redirect(303, '/auth/login');
		}
	}

	// Admin routes: /admin/*
	if (path.startsWith('/admin')) {
		if (!session?.user) {
			throw redirect(303, '/auth/login');
		}
		if (session.user.role !== 'admin') {
			throw redirect(303, '/dashboard');
		}
	}

	// Redirect authenticated users away from auth pages
	// (but allow verify-email and reset-password since they use tokens, not sessions)
	if (path.startsWith('/auth/') && !path.startsWith('/auth/verify-email') && !path.startsWith('/auth/reset-password')) {
		if (session?.user) {
			throw redirect(303, '/dashboard');
		}
	}

	return resolve(event);
};

export const handle = sequence(authHandle, authorizationHandle);
