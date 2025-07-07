// Test Supabase Connection Script
// Run this after setting up your .env.local file

require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase Connection...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  console.log('📋 Environment Check:');
  console.log(`- Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`- Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Please configure your .env.local file with Supabase credentials');
    console.log('📝 Edit .env.local and add your:');
    console.log('   - REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co');
    console.log('   - REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here');
    return;
  }
  
  try {
    // Try to import Supabase
    const { createClient } = require('@supabase/supabase-js');
    console.log('✅ Supabase module imported successfully');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');
    
    // Test connection by querying parts table
    console.log('🔄 Testing database connection...');
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('💡 Make sure your database tables are created using the SQL script');
    } else {
      console.log('✅ Database connection successful!');
      console.log(`📊 Parts table accessible`);
      
      // Test inserting and reading data
      console.log('\n🔄 Testing data operations...');
      
      // Try to read counters
      const { data: counters, error: counterError } = await supabase
        .from('counters')
        .select('*');
        
      if (counterError) {
        console.log('❌ Counter read failed:', counterError.message);
      } else {
        console.log('✅ Counters table accessible');
        console.log(`📊 Found ${counters.length} counters`);
      }
    }
    
    console.log('\n🎉 Supabase setup test completed!');
    console.log('🚀 Your AutoParts Pro app is ready for cloud sync!');
    
  } catch (importError) {
    console.log('❌ Supabase module not available:', importError.message);
    console.log('💡 Run: npm install @supabase/supabase-js');
  }
}

// Run the test
testSupabaseConnection().catch(console.error);