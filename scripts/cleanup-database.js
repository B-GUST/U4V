const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

const client = new Client(config);

async function runCleanup() {
  await client.connect();
  console.log("Connected to PostgreSQL database successfully.");

  // 1. Verificar si hay un usuario admin
  const adminRes = await client.query("SELECT id, nombre_organizacion, rol FROM public.perfiles WHERE rol = 'admin'");
  console.log("Super Admin profile found in public.perfiles:", adminRes.rows);

  if (adminRes.rows.length === 0) {
    console.error("CRITICAL: No admin profile found in public.perfiles. Aborting database cleanup to prevent total lockout.");
    process.exit(1);
  }

  const adminId = adminRes.rows[0].id;
  console.log(`Retaining admin user: ${adminRes.rows[0].nombre_organizacion} (ID: ${adminId})`);

  // 2. Truncar tablas transaccionales en cascada
  const tablesToTruncate = [
    'public.despachos',
    'public.reportes_terreno',
    'public.solicitudes_recursos',
    'public.despachos_intermedios',
    'public.postulaciones_solicitudes',
    'public.reportes_incidencias',
    'public.traslados_pacientes',
    'public.boletin_avisos',
    'public.registro_auditoria',
    'public.nodos_geograficos'
  ];

  console.log("Truncating transactional tables...");
  for (const table of tablesToTruncate) {
    console.log(`Truncating ${table}...`);
    await client.query(`TRUNCATE TABLE ${table} CASCADE`);
  }

  // 3. Borrar perfiles que no sean de rol 'admin'
  console.log("Deleting non-admin user profiles...");
  const deleteProfilesRes = await client.query("DELETE FROM public.perfiles WHERE rol != 'admin'");
  console.log(`Deleted ${deleteProfilesRes.rowCount} profile records.`);

  // 4. Borrar usuarios de auth.users que no sean del admin
  console.log("Deleting corresponding auth.users records...");
  const deleteAuthRes = await client.query("DELETE FROM auth.users WHERE id != $1", [adminId]);
  console.log(`Deleted ${deleteAuthRes.rowCount} auth.users records.`);

  console.log("Database cleanup executed successfully. Only the Super Admin user remains.");
}

runCleanup()
  .then(() => {
    client.end();
    process.exit(0);
  })
  .catch(err => {
    console.error("Error executing cleanup:", err);
    client.end();
    process.exit(1);
  });
