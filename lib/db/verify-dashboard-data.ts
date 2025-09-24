// Verify dashboard data exists
import { db } from './drizzle';
import { teams, users, families, children, securityAlerts, schoolSettings } from './schema';
import { sql, count } from 'drizzle-orm';

async function verifyDashboardData() {
  console.log('🔍 Verifying dashboard data...');
  
  try {
    // Check teams
    const teamCount = await db.select({ count: count() }).from(teams);
    console.log(`📊 Teams: ${teamCount[0].count}`);
    
    // Check users
    const userCount = await db.select({ count: count() }).from(users);
    console.log(`👥 Users: ${userCount[0].count}`);
    
    // Check families
    const familyCount = await db.select({ count: count() }).from(families);
    console.log(`👨‍👩‍👧‍👦 Families: ${familyCount[0].count}`);
    
    // Check children
    const childrenCount = await db.select({ count: count() }).from(children);
    console.log(`🧒 Children: ${childrenCount[0].count}`);
    
    // Check security alerts
    const alertCount = await db.select({ count: count() }).from(securityAlerts);
    console.log(`🚨 Security Alerts: ${alertCount[0].count}`);
    
    // Check school settings
    const settingsCount = await db.select({ count: count() }).from(schoolSettings);
    console.log(`⚙️ School Settings: ${settingsCount[0].count}`);
    
    // Sample a few records
    console.log('\n📋 Sample Data:');
    
    const sampleTeams = await db.select().from(teams).limit(2);
    console.log('Teams:', sampleTeams.map(t => ({ id: t.id, name: t.name })));
    
    const sampleUsers = await db.select().from(users).limit(3);
    console.log('Users:', sampleUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
    
    const sampleAlerts = await db.select().from(securityAlerts).limit(2);
    console.log('Alerts:', sampleAlerts.map(a => ({ type: a.type, severity: a.severity, message: a.message })));
    
    console.log('\n✅ Dashboard data verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  }
}

if (require.main === module) {
  verifyDashboardData()
    .then(() => {
      console.log('🎉 Verification successful!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}