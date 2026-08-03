const { Client } = require('pg');

async function verify() {
  const client = new Client({
    host: 'aws-1-us-west-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.bbdqbymhqeqywpgtsvec',
    password: 'buscador_proyectos',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('🔍 Verifying Supabase data...\n');

  const tables = ['empresa', 'usuario', 'proyecto', 'chat', 'mensaje', 
                  'kanban_columna', 'tarea', 'tarea_comentario', 'recurso',
                  'proyecto_imagen', 'usuario_proyecto', 'solicitud_membresia', 
                  'solicitud_proyecto'];
  
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM public.${table}`);
      const icon = parseInt(res.rows[0].count) > 0 ? '✅' : '⚠️';
      console.log(`  ${icon} ${table}: ${res.rows[0].count} rows`);
    } catch (err) {
      console.log(`  ❌ ${table}: ${err.message.substring(0, 60)}`);
    }
  }

  await client.end();
}

verify();
