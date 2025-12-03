/**
 * Test User Seed Script for Officing
 * 
 * This script creates test users and populates realistic test data
 * Run with: node supabase/seed-test-users.js
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install @supabase/supabase-js
 * 2. Set environment variables:
 *    - SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY (service role key, not anon key!)
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user configurations
const TEST_USERS = [
  {
    email: 'test1@example.com',
    password: 'TestUser123!',
    profile: 'active',
    description: 'Active User - 30 days history'
  },
  {
    email: 'test2@example.com',
    password: 'TestUser123!',
    profile: 'new',
    description: 'New User - just started'
  },
  {
    email: 'test3@example.com',
    password: 'TestUser123!',
    profile: 'power',
    description: 'Power User - extensive history'
  }
];

/**
 * Create a test user in Supabase Auth
 */
async function createTestUser(email, password) {
  console.log(`  Creating user: ${email}...`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (error) {
    if (error.message.includes('already registered')) {
      console.log(`  ⚠️  User already exists, fetching existing user...`);
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === email);
      return existingUser;
    }
    throw error;
  }
  
  console.log(`  ✅ User created: ${data.user.id}`);
  return data.user;
}

/**
 * Generate check-in dates for a user
 */
function generateCheckInDates(daysBack, skipPattern = null) {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < daysBack; i++) {
    if (skipPattern && skipPattern(i)) continue;
    
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  return dates;
}

/**
 * Seed data for Active User (Test User 1)
 */
async function seedActiveUser(userId) {
  console.log('  Seeding active user data...');
  
  // Get title IDs
  const { data: titles } = await supabase.from('titles').select('id, name');
  const title7day = titles.find(t => t.name === '一週間の戦士')?.id;
  
  // User Progress
  await supabase.from('user_progress').upsert({
    user_id: userId,
    level: 8,
    current_xp: 450,
    total_points: 3500,
    current_streak: 7,
    max_streak: 14,
    active_title_id: title7day,
    pity_counter: 12
  });
  
  // Lottery Tickets
  await supabase.from('lottery_tickets').upsert({
    user_id: userId,
    ticket_count: 3,
    earned_from: 'monthly_checkins'
  });
  
  // Attendances (30 days with some gaps)
  const checkInDates = generateCheckInDates(30, (i) => {
    // Skip days 8, 10, and every 3rd day after day 14
    return i === 8 || i === 10 || (i > 14 && i % 3 === 0);
  });
  
  const tags = ['officeA', 'home', 'meetingRoom'];
  const attendances = checkInDates.map((date, idx) => ({
    user_id: userId,
    check_in_date: date.toISOString().split('T')[0],
    check_in_time: new Date(date.setHours(9, 0, 0)).toISOString(),
    tag: tags[idx % tags.length],
    month: date.getMonth() + 1,
    year: date.getFullYear()
  }));
  
  await supabase.from('attendances').upsert(attendances);
  
  // Unlocked Titles
  const titleNames = ['3日坊主克服', '一週間の戦士', '出社ビギナー', 'レベル5達成'];
  const userTitles = titles
    .filter(t => titleNames.includes(t.name))
    .map(t => ({
      user_id: userId,
      title_id: t.id,
      unlocked_at: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString()
    }));
  
  await supabase.from('user_titles').upsert(userTitles);
  
  // Quest Logs
  const { data: quests } = await supabase.from('quests').select('id, title').limit(3);
  const questLogs = [];
  
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    questLogs.push({
      user_id: userId,
      quest_id: quests[i % quests.length].id,
      assigned_date: date.toISOString().split('T')[0],
      completed_at: new Date(date.setHours(10, 0, 0)).toISOString(),
      xp_earned: 50 + Math.floor(Math.random() * 100),
      points_earned: 50 + Math.floor(Math.random() * 100)
    });
  }
  
  await supabase.from('user_quest_logs').upsert(questLogs);
  
  // Lottery Log
  const { data: prizes } = await supabase.from('prizes').select('id, rank').limit(5);
  const lotteryLogs = prizes.slice(0, 3).map((prize, idx) => ({
    user_id: userId,
    prize_id: prize.id,
    rank: prize.rank,
    pity_counter_at_draw: 5 + idx * 3,
    drawn_at: new Date(Date.now() - (idx + 1) * 2 * 24 * 60 * 60 * 1000).toISOString()
  }));
  
  await supabase.from('lottery_log').upsert(lotteryLogs);
  
  console.log('  ✅ Active user data seeded');
}

/**
 * Seed data for New User (Test User 2)
 */
async function seedNewUser(userId) {
  console.log('  Seeding new user data...');
  
  // Get title IDs
  const { data: titles } = await supabase.from('titles').select('id, name');
  const title3day = titles.find(t => t.name === '3日坊主克服')?.id;
  
  // User Progress
  await supabase.from('user_progress').upsert({
    user_id: userId,
    level: 2,
    current_xp: 80,
    total_points: 250,
    current_streak: 2,
    max_streak: 3,
    active_title_id: title3day,
    pity_counter: 0
  });
  
  // Lottery Tickets
  await supabase.from('lottery_tickets').upsert({
    user_id: userId,
    ticket_count: 0,
    earned_from: 'initial'
  });
  
  // Attendances (Only last 3 days)
  const checkInDates = generateCheckInDates(3);
  const attendances = checkInDates.map(date => ({
    user_id: userId,
    check_in_date: date.toISOString().split('T')[0],
    check_in_time: new Date(date.setHours(9, 30, 0)).toISOString(),
    tag: 'officeA',
    month: date.getMonth() + 1,
    year: date.getFullYear()
  }));
  
  await supabase.from('attendances').upsert(attendances);
  
  // Unlocked Titles (Just one)
  await supabase.from('user_titles').upsert({
    user_id: userId,
    title_id: title3day,
    unlocked_at: new Date().toISOString()
  });
  
  // Quest Logs (Only 2 completed)
  const { data: quests } = await supabase.from('quests').select('id').limit(1);
  const questLogs = [0, 1].map(i => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      user_id: userId,
      quest_id: quests[0].id,
      assigned_date: date.toISOString().split('T')[0],
      completed_at: new Date(date.setHours(10, 0, 0)).toISOString(),
      xp_earned: 50,
      points_earned: 50
    };
  });
  
  await supabase.from('user_quest_logs').upsert(questLogs);
  
  console.log('  ✅ New user data seeded');
}

/**
 * Seed data for Power User (Test User 3)
 */
async function seedPowerUser(userId) {
  console.log('  Seeding power user data...');
  
  // Get title IDs
  const { data: titles } = await supabase.from('titles').select('id, name');
  const titleAmateur = titles.find(t => t.name === '出社アマチュア')?.id;
  
  // User Progress
  await supabase.from('user_progress').upsert({
    user_id: userId,
    level: 15,
    current_xp: 1200,
    total_points: 8500,
    current_streak: 30,
    max_streak: 45,
    active_title_id: titleAmateur,
    pity_counter: 45
  });
  
  // Lottery Tickets
  await supabase.from('lottery_tickets').upsert({
    user_id: userId,
    ticket_count: 8,
    earned_from: 'accumulated'
  });
  
  // Attendances (60 days consistent)
  const checkInDates = generateCheckInDates(60);
  const tags = ['officeA', 'home', 'meetingRoom', 'cafe'];
  const attendances = checkInDates.map((date, idx) => {
    const hour = idx % 7 === 0 ? 7 : (idx % 7 === 6 ? 10 : 8);
    return {
      user_id: userId,
      check_in_date: date.toISOString().split('T')[0],
      check_in_time: new Date(date.setHours(hour, 45, 0)).toISOString(),
      tag: tags[idx % tags.length],
      month: date.getMonth() + 1,
      year: date.getFullYear()
    };
  });
  
  await supabase.from('attendances').upsert(attendances);
  
  // Unlocked Titles (Many)
  const userTitles = titles
    .filter(t => ['streak', 'attendance', 'level'].includes(t.unlock_condition_type))
    .slice(0, 10)
    .map(t => ({
      user_id: userId,
      title_id: t.id,
      unlocked_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
  
  await supabase.from('user_titles').upsert(userTitles);
  
  // Quest Logs (Many completed)
  const { data: quests } = await supabase.from('quests').select('id, base_xp, base_points').eq('quest_type', 'daily').limit(10);
  const questLogs = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const quest = quests[i % quests.length];
    questLogs.push({
      user_id: userId,
      quest_id: quest.id,
      assigned_date: date.toISOString().split('T')[0],
      completed_at: new Date(date.setHours(11, 0, 0)).toISOString(),
      xp_earned: quest.base_xp + Math.floor(Math.random() * 100),
      points_earned: quest.base_points + Math.floor(Math.random() * 100)
    });
  }
  
  await supabase.from('user_quest_logs').upsert(questLogs);
  
  // Lottery Log (Many draws)
  const { data: prizes } = await supabase.from('prizes').select('id, rank');
  const ranks = ['C', 'C', 'C', 'B', 'B', 'A'];
  const lotteryLogs = [];
  
  for (let i = 0; i < 15; i++) {
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    lotteryLogs.push({
      user_id: userId,
      prize_id: prize.id,
      rank: ranks[Math.floor(Math.random() * ranks.length)],
      pity_counter_at_draw: Math.floor(Math.random() * 50),
      drawn_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  await supabase.from('lottery_log').upsert(lotteryLogs);
  
  console.log('  ✅ Power user data seeded');
}

/**
 * Main execution
 */
async function main() {
  console.log('==========================================');
  console.log('Officing Test User Seed Script');
  console.log('==========================================');
  console.log('');
  
  try {
    // Create test users
    console.log('📝 Creating test users...');
    console.log('');
    
    const users = [];
    for (const config of TEST_USERS) {
      const user = await createTestUser(config.email, config.password);
      users.push({ ...user, profile: config.profile, description: config.description });
    }
    
    console.log('');
    console.log('📊 Seeding test data...');
    console.log('');
    
    // Seed data for each user
    for (const user of users) {
      console.log(`Seeding ${user.description}...`);
      
      if (user.profile === 'active') {
        await seedActiveUser(user.id);
      } else if (user.profile === 'new') {
        await seedNewUser(user.id);
      } else if (user.profile === 'power') {
        await seedPowerUser(user.id);
      }
      
      console.log('');
    }
    
    console.log('==========================================');
    console.log('✅ Test data setup complete!');
    console.log('==========================================');
    console.log('');
    console.log('Test users are ready:');
    console.log('');
    console.log('1. Active User (30 days history):');
    console.log('   Email: test1@example.com');
    console.log('   Password: TestUser123!');
    console.log('   Level: 8, Streak: 7 days');
    console.log('');
    console.log('2. New User (just started):');
    console.log('   Email: test2@example.com');
    console.log('   Password: TestUser123!');
    console.log('   Level: 2, Streak: 2 days');
    console.log('');
    console.log('3. Power User (extensive history):');
    console.log('   Email: test3@example.com');
    console.log('   Password: TestUser123!');
    console.log('   Level: 15, Streak: 30 days');
    console.log('');
    console.log('You can now log in with these credentials!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
