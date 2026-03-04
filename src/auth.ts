import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Google from '@auth/sveltekit/providers/google';
import GitHub from '@auth/sveltekit/providers/github';
import { db } from '$lib/server/db';
import { users, sessions, accounts, verificationTokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const { handle } = SvelteKitAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		sessionsTable: sessions,
		accountsTable: accounts,
		verificationTokensTable: verificationTokens
	}),
	session: {
		strategy: 'database'
	},
	callbacks: {
		async session({ session, user }) {
			if (user?.id) {
				const [dbUser] = await db
					.select({ role: users.role })
					.from(users)
					.where(eq(users.id, user.id))
					.limit(1);

				if (dbUser) {
					session.user.role = dbUser.role;
				}
			}
			session.user.id = user.id;
			return session;
		}
	},
	providers: [
		Google({ allowDangerousEmailAccountLinking: true }),
		GitHub({ allowDangerousEmailAccountLinking: true })
	],
	pages: {
		signIn: '/auth/login'
	},
	trustHost: true
});
