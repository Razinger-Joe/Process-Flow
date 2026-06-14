import { createClient } from '@supabase/supabase-js';
import { listWorkflows } from '../src/lib/api/workflows';

const supabaseUrl = 'https://uhjeqahmszskjmkyjigo.supabase.co';
const supabaseAnonKey = 'sb_publishable_QH3kT2EMpSTJUkcyAqEYEA_lrN3ke9R';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testList() {
  try {
    console.log('Calling listWorkflows()...');
    const workflows = await listWorkflows();
    console.log('Workflows loaded successfully. Count:', workflows.length);
    console.log('First workflow:', workflows[0]?.name);
  } catch (error) {
    console.error('Error during listWorkflows():', error);
  }
}

testList();
