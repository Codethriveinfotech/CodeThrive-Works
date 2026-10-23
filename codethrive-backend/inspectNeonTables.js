const { pool } = require('./config/db');

async function inspectTables() {
  const tablesRes = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );

  console.log(`\n==============================================`);
  console.log(`   NEON POSTGRESQL LIVE SCHEMA AUDIT`);
  console.log(`   Total Tables: ${tablesRes.rows.length}`);
  console.log(`==============================================\n`);

  for (const row of tablesRes.rows) {
    const colRes = await pool.query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1 
       ORDER BY ordinal_position;`,
      [row.table_name]
    );

    const countRes = await pool.query(`SELECT count(*) FROM ${row.table_name}`);
    console.log(`📌 Table: [${row.table_name}]  (Live Rows: ${countRes.rows[0].count})`);
    
    colRes.rows.forEach(c => {
      const typeStr = c.character_maximum_length ? `${c.data_type}(${c.character_maximum_length})` : c.data_type;
      console.log(`   ├── ${c.column_name.padEnd(30)} : ${typeStr}`);
    });
    console.log('');
  }

  process.exit(0);
}

inspectTables().catch(e => {
  console.error(e);
  process.exit(1);
});
