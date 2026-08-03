const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
  const client = new Client({
    host: 'aws-1-us-west-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.bbdqbymhqeqywpgtsvec',
    password: 'buscador_proyectos',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    statement_timeout: 60000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    // Read the SQL dump
    const sqlPath = path.join(__dirname, '..', 'data', 'buscador_supabase.sql');
    console.log('📖 Reading SQL dump...');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Clean up the SQL for Supabase compatibility
    // Remove pg_dump specific commands that won't work
    sql = sql.replace(/\\restrict[^\n]*/g, '');
    sql = sql.replace(/SET transaction_timeout[^\n]*/g, '');
    
    // Remove OWNER TO statements (Supabase manages ownership)
    sql = sql.replace(/ALTER TABLE [^\n]* OWNER TO [^\n]*/g, '');
    sql = sql.replace(/ALTER SEQUENCE [^\n]* OWNER TO [^\n]*/g, '');
    
    // Remove comments about owner
    // Keep CREATE TABLE, INSERT, ALTER TABLE (constraints), CREATE INDEX, etc.

    // Split into individual statements
    // We need to be careful with COPY statements and their data
    const lines = sql.split('\n');
    let statements = [];
    let currentStatement = '';
    let inCopyBlock = false;
    let copyData = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip comments and empty lines
      if (line.startsWith('--') || line.trim() === '') {
        if (inCopyBlock) {
          if (line === '\\.') {
            inCopyBlock = false;
            // Convert COPY to INSERT statements later - skip for now
          } else {
            copyData.push(line);
          }
        }
        continue;
      }

      if (inCopyBlock) {
        if (line === '\\.') {
          inCopyBlock = false;
        } else {
          copyData.push(line);
        }
        continue;
      }

      // Detect COPY ... FROM stdin
      if (line.startsWith('COPY ')) {
        inCopyBlock = true;
        copyData = [];
        // We'll skip COPY blocks - data should be in INSERT statements
        continue;
      }

      // Skip SET and SELECT config commands that might cause issues
      if (line.startsWith('SET ') || line.startsWith('SELECT pg_catalog')) {
        continue;
      }

      currentStatement += line + '\n';

      if (line.trim().endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt && stmt !== ';') {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute statements one by one
    let success = 0;
    let errors = 0;
    let skipped = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip certain statements
      if (stmt.includes('pg_catalog') || 
          stmt.includes('OWNER TO') ||
          stmt.includes('GRANT ') ||
          stmt.includes('REVOKE ') ||
          stmt.includes('CREATE EXTENSION') ||
          stmt.includes('COMMENT ON') ||
          stmt.includes('pg_dump') ||
          stmt.includes('idle_in_transaction_session_timeout') ||
          stmt.includes('row_security')) {
        skipped++;
        continue;
      }

      try {
        await client.query(stmt);
        success++;
        
        // Log progress for important statements
        if (stmt.startsWith('CREATE TABLE')) {
          const match = stmt.match(/CREATE TABLE [\w.]*\.?(\w+)/);
          console.log(`  ✅ Created table: ${match ? match[1] : '?'}`);
        } else if (stmt.startsWith('INSERT')) {
          if (success % 50 === 0) {
            process.stdout.write(`  📥 Inserted ${success} records...\r`);
          }
        }
      } catch (err) {
        errors++;
        // Only log non-trivial errors
        if (!err.message.includes('already exists') && 
            !err.message.includes('duplicate key') &&
            !err.message.includes('does not exist') &&
            errors <= 10) {
          console.error(`  ⚠️  Error: ${err.message.substring(0, 120)}`);
          console.error(`      Statement: ${stmt.substring(0, 100)}...`);
        }
      }
    }

    console.log(`\n📊 Import summary:`);
    console.log(`  ✅ Success: ${success}`);
    console.log(`  ⚠️  Errors: ${errors}`);
    console.log(`  ⏩ Skipped: ${skipped}`);

    // Verify the import
    console.log('\n🔍 Verifying imported data...');
    const tables = ['empresa', 'usuario', 'proyecto', 'chat', 'mensaje', 
                    'kanban_columna', 'tarea', 'tarea_comentario', 'recurso',
                    'proyecto_imagen', 'usuario_proyecto', 'solicitud_membresia', 
                    'solicitud_proyecto'];
    
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM public.${table}`);
        console.log(`  📋 ${table}: ${res.rows[0].count} rows`);
      } catch (err) {
        console.log(`  ❌ ${table}: ${err.message.substring(0, 60)}`);
      }
    }

    await client.end();
    console.log('\n✅ Import complete!');
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    await client.end();
  }
}

importDatabase();
