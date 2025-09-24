// Create missing security_alerts table directly
import { db } from './drizzle';
import { sql } from 'drizzle-orm';

async function createSecurityAlertsTable() {
  console.log('Creating security_alerts table if not exists...');
  
  try {
    // Create the security_alerts table directly
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS security_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id INTEGER REFERENCES teams(id),
        type alert_type NOT NULL,
        severity alert_severity NOT NULL,
        message TEXT NOT NULL,
        metadata TEXT,
        resolved BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id)
      );
    `);
    
    console.log('✅ security_alerts table created successfully');
    
    // Create some sample security alerts
    await db.execute(sql`
      INSERT INTO security_alerts (school_id, type, severity, message, metadata, resolved) 
      VALUES 
        (1, 'failed_logins', 'medium', '3 failed login attempts detected', '{"ip":"192.168.1.100","attempts":3}', false),
        (1, 'suspicious_ip', 'high', 'Login from unusual location detected', '{"ip":"203.45.67.89","country":"Unknown"}', false)
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ Sample security alerts created');
    
  } catch (error) {
    console.error('Error creating security_alerts table:', error);
    throw error;
  }
}

if (require.main === module) {
  createSecurityAlertsTable()
    .then(() => {
      console.log('🎉 Security alerts table setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { createSecurityAlertsTable };