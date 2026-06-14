import { createClient } from '@supabase/supabase-js';
import { WorkflowEngine } from '../src/lib/engine/executionEngine';

const supabaseUrl = 'https://uhjeqahmszskjmkyjigo.supabase.co';
const supabaseAnonKey = 'sb_publishable_QH3kT2EMpSTJUkcyAqEYEA_lrN3ke9R';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  const userId = 'aa03401c-e1e7-430e-9d3b-f6ce3ea3a6c2';

  // 1. Create a simple workflow
  const definition = {
    nodes: [
      {
        id: "n1",
        type: "output",
        label: "Log result",
        config: { message: "Hello World from automated test!" }
      }
    ],
    edges: []
  };

  const { data: workflow, error: wfError } = await supabase
    .from('workflows')
    .insert({
      user_id: userId,
      name: 'Automated Test Workflow',
      description: 'Automatically created to test the engine',
      definition,
      is_active: true
    })
    .select()
    .single();

  if (wfError) {
    console.error('Error creating workflow:', wfError);
    return;
  }
  console.log('Created workflow ID:', workflow.id);

  // 2. Create a run record
  const { data: runRecord, error: runError } = await supabase
    .from('run_records')
    .insert({
      workflow_id: workflow.id,
      user_id: userId,
      status: 'idle',
      logs: [{ id: 'init', timestamp: new Date().toISOString(), level: 'info', message: 'Test started' }]
    })
    .select()
    .single();

  if (runError) {
    console.error('Error creating run record:', runError);
    return;
  }
  console.log('Created run record ID:', runRecord.id);

  // 3. Execute
  const engine = new WorkflowEngine(supabase);
  console.log('Starting background execution engine...');
  await engine.execute(runRecord.id);

  // 4. Verify results
  const { data: finalRecord } = await supabase.from('run_records').select('status, logs').eq('id', runRecord.id).single();
  console.log('Final Status:', finalRecord.status);
  console.log('Final Logs:');
  finalRecord.logs.forEach((log: any) => {
    console.log(`[${log.level.toUpperCase()}] ${log.message}`);
  });
}

runTest().catch(console.error);
