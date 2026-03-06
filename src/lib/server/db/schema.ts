import {
	pgTable,
	text,
	timestamp,
	integer,
	primaryKey,
	varchar,
	boolean,
	serial,
	index,
	customType
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from '@auth/core/adapters';

// Custom pgvector type
const vector = customType<{ data: number[]; driverParam: string }>({
	dataType() {
		return 'vector(384)';
	},
	toDriver(value: number[]): string {
		return `[${value.join(',')}]`;
	},
	fromDriver(value: string): number[] {
		return JSON.parse(value);
	}
});

// ── Auth Tables ──

export const users = pgTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name'),
	email: text('email').unique().notNull(),
	emailVerified: timestamp('email_verified', { mode: 'date' }),
	image: text('image'),
	password: text('password'),
	role: varchar('role', { length: 20 }).notNull().default('user'),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
});

export const accounts = pgTable(
	'accounts',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').$type<AdapterAccountType>().notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('provider_account_id').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state')
	},
	(account) => [
		primaryKey({
			columns: [account.provider, account.providerAccountId]
		})
	]
);

export const sessions = pgTable('sessions', {
	sessionToken: text('session_token').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { mode: 'date' }).notNull()
});

export const verificationTokens = pgTable(
	'verification_tokens',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(verificationToken) => [
		primaryKey({
			columns: [verificationToken.identifier, verificationToken.token]
		})
	]
);

export const passwordResetTokens = pgTable('password_reset_tokens', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expires: timestamp('expires', { mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
});

export const emailVerificationTokens = pgTable('email_verification_tokens', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expires: timestamp('expires', { mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
});

// ── RAG Tables ──

export const documents = pgTable('documents', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	type: varchar('type', { length: 50 }).notNull().default('text'),
	content: text('content'),
	uploadedBy: text('uploaded_by')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
});

export const chunks = pgTable('chunks', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	documentId: text('document_id')
		.notNull()
		.references(() => documents.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	chunkIndex: integer('chunk_index').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
});

export const embeddings = pgTable(
	'embeddings',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		chunkId: text('chunk_id')
			.notNull()
			.references(() => chunks.id, { onDelete: 'cascade' }),
		embedding: vector('embedding').notNull()
	},
	(table) => [index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops'))]
);

// ── Chat Tables (tree-structured) ──

export const conversations = pgTable('conversations', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	title: text('title').notNull().default('New Chat'),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
});

export const messages = pgTable(
	'messages',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		conversationId: text('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),
		parentId: text('parent_id'),
		role: varchar('role', { length: 20 }).notNull(),
		content: text('content').notNull(),
		citations: text('citations'),
		branchIndex: integer('branch_index').notNull().default(0),
		createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('msg_conversation_idx').on(table.conversationId),
		index('msg_parent_idx').on(table.parentId)
	]
);
