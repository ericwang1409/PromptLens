import { createClient } from '@supabase/supabase-js';

interface QueryData {
  prompt: string;
  response: string;
  created_at: string;
  rating: number | null;
}

interface FrequentPrompt {
  prompt: string;
  count: number;
  responses: string[];
  avgRating: number | null;
  examples: QueryData[];
}

// Simple similarity function to group similar prompts
function calculateSimilarity(prompt1: string, prompt2: string): number {
  const normalize = (str: string) => 
    str.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();

  const words1 = normalize(prompt1).split(' ');
  const words2 = normalize(prompt2).split(' ');
  
  const allWords = new Set([...words1, ...words2]);
  const intersection = new Set(words1.filter(word => words2.includes(word)));
  
  return intersection.size / allWords.size;
}

// Group similar prompts together
function groupSimilarPrompts(queries: QueryData[], threshold = 0.7): FrequentPrompt[] {
  const groups: FrequentPrompt[] = [];
  
  for (const query of queries) {
    let addedToGroup = false;
    
    // Try to find an existing group for this prompt
    for (const group of groups) {
      if (calculateSimilarity(query.prompt, group.prompt) >= threshold) {
        group.count++;
        group.examples.push(query);
        if (query.response && !group.responses.includes(query.response)) {
          group.responses.push(query.response);
        }
        addedToGroup = true;
        break;
      }
    }
    
    // If no similar group found, create a new one
    if (!addedToGroup) {
      groups.push({
        prompt: query.prompt,
        count: 1,
        responses: query.response ? [query.response] : [],
        avgRating: query.rating,
        examples: [query]
      });
    }
  }
  
  // Calculate average ratings for groups
  groups.forEach(group => {
    const ratingsWithValues = group.examples.filter(ex => ex.rating !== null);
    if (ratingsWithValues.length > 0) {
      group.avgRating = ratingsWithValues.reduce((sum, ex) => sum + (ex.rating || 0), 0) / ratingsWithValues.length;
    }
  });
  
  return groups;
}

// Generate markdown FAQ from frequent prompts
function generateMarkdownFAQ(frequentPrompts: FrequentPrompt[]): string {
  let markdown = '# Frequently Asked Questions\n\n';
  
  if (frequentPrompts.length === 0) {
    markdown += 'No frequently asked questions found yet. Continue using the system to build your personalized FAQ!\n\n';
    markdown += '*Note: Questions need to be asked at least 5 times to appear in this FAQ.*\n';
    return markdown;
  }
  
  markdown += `Based on your conversation history, here are the questions you ask most often:\n\n`;
  
  frequentPrompts.forEach((item, index) => {
    markdown += `## ${index + 1}. ${item.prompt}\n\n`;
    markdown += `**Asked ${item.count} times**\n\n`;
    
    if (item.avgRating) {
      markdown += `*Average rating: ${item.avgRating.toFixed(1)}/5*\n\n`;
    }
    
    if (item.responses.length > 0) {
      markdown += `**Most common response:**\n\n`;
      // Use the most recent response or first one
      const response = item.responses[0];
      if (response.length > 300) {
        markdown += `${response.substring(0, 300)}...\n\n`;
      } else {
        markdown += `${response}\n\n`;
      }
    }
    
    markdown += '---\n\n';
  });
  
  return markdown;
}

export async function POST(req: Request) {
  try {
    // Get auth token from headers
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client to verify auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Extract token from Bearer token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch user's prompts from the database
    const { data: queries, error: queryError } = await supabase
      .from('queries')
      .select('prompt, response, created_at, rating')
      .eq('user_id', user.id)
      .not('prompt', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000); // Get more data for better analysis

    if (queryError) {
      throw new Error(`Failed to fetch queries: ${queryError.message}`);
    }

    if (!queries || queries.length === 0) {
      return Response.json({
        faq: '# FAQ\n\nNo frequently asked questions found yet. Start asking more questions to build your personalized FAQ!\n\n*Note: Questions need to be asked at least 5 times to appear in this FAQ.*'
      });
    }

    // Group similar prompts together
    const groupedPrompts = groupSimilarPrompts(queries as QueryData[]);
    
    // Filter for prompts that appear 5 or more times
    const frequentPrompts = groupedPrompts
      .filter(group => group.count >= 5)
      .sort((a, b) => b.count - a.count) // Sort by frequency
      .slice(0, 15); // Limit to top 15 most frequent

    // Generate markdown FAQ
    const faqContent = generateMarkdownFAQ(frequentPrompts);

    // Calculate statistics
    const totalQueries = queries.length;
    const totalFrequentQueries = frequentPrompts.reduce((sum, item) => sum + item.count, 0);
    const avgRating = queries.filter(q => q.rating).reduce((sum, q) => sum + (q.rating || 0), 0) / queries.filter(q => q.rating).length || 0;
    const dateRange = {
      earliest: queries[queries.length - 1]?.created_at,
      latest: queries[0]?.created_at
    };

    return Response.json({
      faq: faqContent,
      stats: {
        totalQueries,
        frequentQueries: frequentPrompts.length,
        totalFrequentQueries,
        avgRating: avgRating > 0 ? Number(avgRating.toFixed(1)) : null,
        dateRange,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error generating FAQ:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Failed to generate FAQ' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}