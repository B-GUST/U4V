const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargador manual de variables
let dbUrl = process.env.SUPABASE_DATABASE_URL;
if (!dbUrl) {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && match[1] === 'SUPABASE_DATABASE_URL') {
        dbUrl = (match[2] || '').trim().replace(/['"]/g, '');
      }
    });
  }
}

if (!dbUrl) {
  console.error('No SUPABASE_DATABASE_URL found.');
  process.exit(1);
}

// Separar a mano el URL para evitar problemas de parseo con caracteres raros (#, ^) en el password
const matches = dbUrl.match(/^postgresql:\/\/([^:]+):(.*)@([^:]+):(\d+)\/(.+)$/);
if (!matches) {
  console.error('Failed to parse database connection URL.');
  process.exit(1);
}

const config = {
  user: matches[1],
  password: matches[2],
  host: matches[3],
  port: parseInt(matches[4], 10),
  database: matches[5],
  ssl: { rejectUnauthorized: false }
};

// Cargar la migración especificada como argumento (por defecto 007)
const migrationName = process.argv[2] || '007_registro_auditoria.sql';
console.log(`Applying migration: ${migrationName}...`);

const sql = fs.readFileSync(path.resolve(__dirname, '../supabase/migrations', migrationName), 'utf8');

const client = new Client(config);

client.connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log(`Migration ${migrationName} applied successfully.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(`Error applying migration ${migrationName}:`, err);
    process.exit(1);
  });
