import * as bcrypt from 'bcrypt';

/**
 * Run with: npx ts-node src/seed.ts
 * 
 * This will print the SQL to update the superadmin password.
 * You can also run it to seed the database directly.
 */
async function seed() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('=== Superadmin Credentials ===');
  console.log(`Email: admin@platform.com`);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('');
  console.log('SQL to update:');
  console.log(`UPDATE usuario SET password = '${hash}', estado = 'activo' WHERE correo = 'admin@platform.com';`);
}

seed();
