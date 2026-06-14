import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { WorkflowEngine } from '@/lib/engine/executionEngine';
import { after } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    // BYPASS AUTH
    // let token = '';
    // const authHeader = req.headers.get('Authorization');
    // if (authHeader && authHeader.startsWith('Bearer ')) {
    //   token = authHeader.substring(7);
    // } else {
    //   const cookieStore = await cookies();
    //   token = cookieStore.get('auth_token')?.value || '';
    // }
    // if (!token) {
    //   return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    // }

    // 2. Initialize Supabase Server Client on behalf of the user
    const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

    // 3. Retrieve user profile to check validity
    // const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    // }
    const user = { id: 'aa03401c-e1e7-430e-9d3b-f6ce3ea3a6c2' };

    // 4. Parse request body
    const body = await req.json().catch(() => ({}));
    const { workflowId } = body;

    if (!workflowId) {
      return NextResponse.json({ error: 'Bad Request: Missing workflowId' }, { status: 400 });
    }

    // 5. Verify workflow exists and user is owner (automatically checked by RLS)
    const { data: workflow, error: wfError } = await supabaseServer
      .from('workflows')
      .select('id, name')
      .eq('id', workflowId)
      .single();

    if (wfError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    // 6. Create run record in Supabase (status: idle)
    const { data: runRecord, error: runError } = await supabaseServer
      .from('run_records')
      .insert({
        workflow_id: workflowId,
        user_id: user.id,
        status: 'idle',
        logs: [
          {
            id: 'init-log',
            timestamp: new Date().toISOString(),
            nodeId: 'system',
            level: 'info',
            message: 'Queued workflow for execution.',
          }
        ],
      })
      .select('*')
      .single();

    if (runError || !runRecord) {
      console.error('Failed to create run record:', runError);
      return NextResponse.json({ error: 'Internal Server Error: Failed to create run record' }, { status: 500 });
    }

    // 7. Spawn the Workflow Engine asynchronously
    const engine = new WorkflowEngine(supabaseServer);
    
    // We defer the execution to complete after response delivery using after
    after(async () => {
      try {
        await engine.execute(runRecord.id);
      } catch (engineErr) {
        console.error(`Background execution error for run ${runRecord.id}:`, engineErr);
      }
    });

    // Return the run record to the client immediately
    return NextResponse.json(runRecord);

  } catch (error: any) {
    console.error('Error in trigger run route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
