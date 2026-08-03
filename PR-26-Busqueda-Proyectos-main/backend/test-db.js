// Quick test to verify Neon connection
const { Client } = require('pg');

async function testConnection() {
  console.log('Testing connection to Neon...');
  
  const client = new Client({
    host: 'ep-ancient-mouse-acg0rx1q-pooler.sa-east-1.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_3IFetA9rKxuJ',
    database: 'neondb',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const res = await client.query('SELECT COUNT(*) FROM proyecto');
    console.log('✅ Proyectos count:', res.rows[0].count);
    
    const res2 = await client.query('SELECT COUNT(*) FROM empresa');
    console.log('✅ Empresas count:', res2.rows[0].count);
    
    const res3 = await client.query('SELECT COUNT(*) FROM usuario');
    console.log('✅ Usuarios count:', res3.rows[0].count);
    
    await client.end();
    console.log('✅ Connection closed cleanly');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();
