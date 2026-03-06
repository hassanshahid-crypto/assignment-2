import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('DATABASE_URL environment variable is required');
	process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function seed() {
	const client = await pool.connect();

	try {
		// Enable pgvector extension
		await client.query('CREATE EXTENSION IF NOT EXISTS vector');
		console.log('pgvector extension enabled.');

		const hashedPassword = await bcrypt.hash('admin123', 12);

		// Check if admin already exists
		const existing = await client.query('SELECT id FROM users WHERE email = $1', [
			'admin@example.com'
		]);

		if (existing.rows.length > 0) {
			console.log('Admin user already exists, skipping seed.');
			return;
		}

		await client.query(
			`INSERT INTO users (id, name, email, password, role, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
			[crypto.randomUUID(), 'Admin User', 'admin@example.com', hashedPassword, 'admin']
		);

		console.log('Admin user seeded successfully!');
		console.log('  Email: admin@example.com');
		console.log('  Password: admin123');
	} catch (error) {
		console.error('Seed failed:', error);
		process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

seed();
