import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateSQL, validateSQL, generateAnswerFromResults } from '@/lib/ai/text-to-sql';

export async function POST(request: Request) {
  const startTime = Date.now();
  let userId = null;
  let generatedSql = '';

  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const supabase = await createServerClient(request);
    
    // Auth check (Admins only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = user.id;

    // TODO: Strict role check
    // In production, also check user.role === 'admin' via DB lookup or claims

    // 1. Generate SQL
    generatedSql = await generateSQL(query);

    // 2. Validate SQL (Safety check)
    if (!validateSQL(generatedSql)) {
      throw new Error('Generated SQL failed validation (unsafe operation detected)');
    }

    // 3. Execute SQL
    const { data, error } = await supabase.rpc('admin_exec_sql', {
      query: generatedSql
    });

    if (error) {
      console.error('SQL execution error:', error);
      console.error('Generated SQL:', generatedSql);
      throw new Error(`SQL execution failed: ${error.message || error.details || 'Unknown error'}`);
    }

    const results = data || [];

    // 4. Generate AI answer from results
    const aiAnswer = await generateAnswerFromResults(query, generatedSql, results);
    
    // 5. Log success
    const duration = Date.now() - startTime;
    
    await supabase.from('search_queries').insert({
      user_id: userId,
      query_text: query,
      generated_sql: generatedSql,
      result_count: results.length,
      execution_time_ms: duration
    });

    return NextResponse.json({
      sql: generatedSql,
      results: results,
      answer: aiAnswer
    });

  } catch (error: any) {
    console.error('Search error:', error);
    
    // Log error
    if (userId) {
      const supabase = await createServerClient(request);
      await supabase.from('search_queries').insert({
        user_id: userId,
        query_text: generatedSql ? `FAILED: ${generatedSql}` : 'GENERATION_FAILED',
        error_message: error.message,
        execution_time_ms: Date.now() - startTime
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

