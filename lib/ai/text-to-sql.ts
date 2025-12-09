import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSQL(naturalLanguageQuery: string): Promise<string> {
  try {
    const prompt = `You are a PostgreSQL expert. Convert the following natural language request into a valid SQL SELECT query.

Database Schema:
- providers (id UUID, company_name TEXT, address TEXT, status TEXT, contact_email TEXT, user_id UUID)
- events (id UUID, name TEXT, location TEXT, date DATE, requirements_managers INTEGER, requirements_supervisors INTEGER, requirements_sia INTEGER, requirements_stewards INTEGER)
- assignments (id UUID, event_id UUID, provider_id UUID, status TEXT, assigned_managers INTEGER, assigned_supervisors INTEGER, assigned_sia INTEGER, assigned_stewards INTEGER, actual_managers INTEGER, actual_supervisors INTEGER, actual_sia INTEGER, actual_stewards INTEGER)
- staff_details (id UUID, assignment_id UUID, staff_name TEXT, sia_number TEXT, role TEXT)
- users (id UUID, email TEXT, role TEXT)

Relationships:
- assignments.event_id -> events.id
- assignments.provider_id -> providers.id
- staff_details.assignment_id -> assignments.id
- providers.user_id -> users.id

IMPORTANT RULES:
1. Return ONLY the SQL query text, no markdown code blocks, no backticks, no explanations.
2. Use standard PostgreSQL syntax with proper table aliases.
3. Use table aliases: p for providers, e for events, a for assignments, sd for staff_details, u for users.
4. For text searches, use ILIKE with % wildcards: WHERE p.company_name ILIKE '%search%'
5. Always include LIMIT 50 unless the query specifically asks for a different limit.
6. Use proper JOIN syntax: JOIN events e ON a.event_id = e.id
7. Do NOT include semicolons at the end of the query.
8. Only SELECT queries are allowed.

Example good query:
SELECT p.company_name, e.name, a.status FROM assignments a JOIN providers p ON a.provider_id = p.id JOIN events e ON a.event_id = e.id WHERE e.name ILIKE '%festival%' LIMIT 50

Now convert this request: "${naturalLanguageQuery}"`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a PostgreSQL expert. Return only valid SQL SELECT queries, no markdown, no explanations, no semicolons.' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.1,
    });

    let sql = completion.choices[0]?.message?.content || '';
    
    // Clean up the SQL - remove markdown code blocks if present
    sql = sql.trim();
    sql = sql.replace(/^```sql\s*/i, '');
    sql = sql.replace(/^```\s*/i, '');
    sql = sql.replace(/\s*```\s*$/i, '');
    sql = sql.trim();
    
    // Remove trailing semicolon if present
    if (sql.endsWith(';')) {
      sql = sql.slice(0, -1).trim();
    }
    
    if (!sql) {
      throw new Error('Generated SQL is empty');
    }

    return sql;

  } catch (error) {
    console.error('Error generating SQL:', error);
    throw new Error('Failed to generate SQL from query');
  }
}

export function validateSQL(sql: string): boolean {
  const upperSQL = sql.toUpperCase();
  
  // Forbidden keywords
  const forbidden = ['DELETE', 'UPDATE', 'DROP', 'ALTER', 'TRUNCATE', 'INSERT', 'GRANT', 'REVOKE'];
  
  if (forbidden.some(keyword => upperSQL.includes(keyword))) {
    return false;
  }
  
  // Must start with SELECT or WITH
  if (!upperSQL.trim().startsWith('SELECT') && !upperSQL.trim().startsWith('WITH')) {
    return false;
  }
  
  return true;
}
