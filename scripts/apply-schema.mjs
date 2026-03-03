import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new pg.Client({
    host: 'db.zlthmnyxbcaivckesszr.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'JKHAuH47Ja9bwxvn',
    ssl: { rejectUnauthorized: false },
});

async function main() {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected!');

    const schemaPath = resolve(__dirname, '../supabase/schema.sql');
    const sql = readFileSync(schemaPath, 'utf-8');

    console.log('Applying schema.sql...');
    try {
        await client.query(sql);
        console.log('Schema applied successfully!');
    } catch (err) {
        console.error('Error applying schema:', err.message);
        if (err.message.includes('already exists')) {
            console.log('Some objects already exist. Schema may be partially applied.');
        }
    }

    await client.end();
    console.log('Done.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
