/**
 * Quest Complete Edge Function
 * 
 * クエスト完了処理を実行し、報酬を付与
 * Requirements: 7.2, 7.3, 8.1, 8.2, 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuestCompleteRequest {
  questLogId: string
}

interface QuestCompleteResponse {
  success: boolean
  error?: string
  rewards?: {
    xpEarned: number
    pointsEarned: number
    level: number
    currentXP: number
    xpForNextLevel: number
    leveledUp: boolean
  }
  newTitles?: any[]
}

// Rank multipliers for quest rewards
// Requirements: 15.1, 15.4
const RANK_MULTIPLIERS: Record<string, number> = {
  'S': 3.0,
  'A': 2.0,
  'B': 1.5,
  'C': 1.0,
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      console.error('No Authorization header found')
      return new Response(
        JSON.stringify({ success: false, error: 'No Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify JWT token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    console.log('User auth result:', { user: user?.id, error: userError?.message })

    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: ' + (userError?.message || 'No user') }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Use admin client for database operations
    const supabaseClient = supabaseAdmin

    // Parse request body
    const body: QuestCompleteRequest = await req.json()
    const questLogId = body.questLogId

    if (!questLogId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quest log ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get quest log with quest details
    const { data: questLog, error: questLogError } = await supabaseClient
      .from('user_quest_logs')
      .select(`
        *,
        quests (
          id,
          title,
          rank,
          base_xp,
          base_points
        )
      `)
      .eq('id', questLogId)
      .eq('user_id', user.id)
      .single()

    if (questLogError) {
      throw questLogError
    }

    if (!questLog) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quest not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if quest is already completed
    if (questLog.completed_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quest already completed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calculate rewards based on quest rank
    // Requirements: 7.2, 15.4
    const rewards = calculateQuestRewards(
      questLog.quests.rank,
      questLog.quests.base_xp,
      questLog.quests.base_points
    )

    // Record quest completion
    // Requirements: 7.3
    await recordQuestCompletion(
      supabaseClient,
      questLogId,
      rewards.xpEarned,
      rewards.pointsEarned
    )

    // Apply XP and points to user progress
    // Requirements: 8.1
    const progressResult = await applyRewardsAndCheckLevelUp(
      supabaseClient,
      user.id,
      rewards.xpEarned,
      rewards.pointsEarned
    )

    // Check for title unlocks
    // Requirements: 6.1
    const newTitles = await checkAndUnlockTitles(
      supabaseClient,
      user.id,
      progressResult.level
    )

    const response: QuestCompleteResponse = {
      success: true,
      rewards: {
        xpEarned: rewards.xpEarned,
        pointsEarned: rewards.pointsEarned,
        level: progressResult.level,
        currentXP: progressResult.currentXP,
        xpForNextLevel: progressResult.xpForNextLevel,
        leveledUp: progressResult.leveledUp,
      },
      newTitles,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Quest complete error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

/**
 * Calculate quest rewards based on rank
 * Requirements: 7.2, 15.4
 */
function calculateQuestRewards(
  rank: string,
  baseXP: number,
  basePoints: number
): { xpEarned: number; pointsEarned: number } {
  const multiplier = RANK_MULTIPLIERS[rank] || 1.0

  return {
    xpEarned: Math.floor(baseXP * multiplier),
    pointsEarned: Math.floor(basePoints * multiplier),
  }
}

/**
 * Record quest completion in user_quest_logs
 * Requirements: 7.3
 */
async function recordQuestCompletion(
  supabaseClient: any,
  questLogId: string,
  xpEarned: number,
  pointsEarned: number
): Promise<void> {
  const { error } = await supabaseClient
    .from('user_quest_logs')
    .update({
      completed_at: new Date().toISOString(),
      xp_earned: xpEarned,
      points_earned: pointsEarned,
    })
    .eq('id', questLogId)

  if (error) {
    throw error
  }
}

/**
 * Apply rewards to user progress and check for level up
 * Requirements: 8.1, 8.2
 */
async function applyRewardsAndCheckLevelUp(
  supabaseClient: any,
  userId: string,
  xpEarned: number,
  pointsEarned: number
): Promise<{
  level: number
  currentXP: number
  xpForNextLevel: number
  leveledUp: boolean
}> {
  // Get current user progress
  const { data: progress, error: progressError } = await supabaseClient
    .from('user_progress')
    .select('level, current_xp, total_points')
    .eq('user_id', userId)
    .single()

  if (progressError) {
    if (progressError.code === 'PGRST116') {
      // Create user_progress if it doesn't exist
      const { error: createError } = await supabaseClient
        .from('user_progress')
        .insert({
          user_id: userId,
          level: 1,
          current_xp: xpEarned,
          total_points: pointsEarned,
          current_streak: 0,
          max_streak: 0,
          pity_counter: 0,
        })

      if (createError) {
        throw createError
      }

      return {
        level: 1,
        currentXP: xpEarned,
        xpForNextLevel: calculateXPForLevel(2),
        leveledUp: false,
      }
    }
    throw progressError
  }

  let currentLevel = progress.level
  let currentXP = progress.current_xp + xpEarned
  let totalPoints = progress.total_points + pointsEarned
  let leveledUp = false

  // Check for level up
  // Requirements: 8.2
  let xpForNextLevel = calculateXPForLevel(currentLevel + 1)
  
  while (currentXP >= xpForNextLevel) {
    currentLevel++
    currentXP -= xpForNextLevel
    xpForNextLevel = calculateXPForLevel(currentLevel + 1)
    leveledUp = true
  }

  // Update user progress
  const { error: updateError } = await supabaseClient
    .from('user_progress')
    .update({
      level: currentLevel,
      current_xp: currentXP,
      total_points: totalPoints,
    })
    .eq('user_id', userId)

  if (updateError) {
    throw updateError
  }

  return {
    level: currentLevel,
    currentXP,
    xpForNextLevel,
    leveledUp,
  }
}

/**
 * Calculate XP required for a given level (exponential growth)
 * Requirements: 8.3
 */
function calculateXPForLevel(level: number): number {
  // Formula: 100 * (level ^ 1.5)
  return Math.floor(100 * Math.pow(level, 1.5))
}

/**
 * Check and unlock titles based on level and quest completion
 * Requirements: 6.1
 */
async function checkAndUnlockTitles(
  supabaseClient: any,
  userId: string,
  currentLevel: number
): Promise<any[]> {
  const newTitles: any[] = []

  // Get all titles
  const { data: allTitles, error: titlesError } = await supabaseClient
    .from('titles')
    .select('*')

  if (titlesError) {
    throw titlesError
  }

  if (!allTitles || allTitles.length === 0) {
    return newTitles
  }

  // Get user's already unlocked titles
  const { data: unlockedTitles, error: unlockedError } = await supabaseClient
    .from('user_titles')
    .select('title_id')
    .eq('user_id', userId)

  if (unlockedError) {
    throw unlockedError
  }

  const unlockedTitleIds = new Set(
    unlockedTitles?.map((ut: any) => ut.title_id) || []
  )

  // Get quest completion count
  const { data: completedQuests } = await supabaseClient
    .from('user_quest_logs')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .not('completed_at', 'is', null)

  const questCompletionCount = completedQuests?.length || 0

  // Check each title for unlock conditions
  for (const title of allTitles) {
    // Skip if already unlocked
    if (unlockedTitleIds.has(title.id)) {
      continue
    }

    let shouldUnlock = false
    const conditionType = title.unlock_condition_type
    const conditionValue = title.unlock_condition_value

    switch (conditionType) {
      case 'level':
        // Check if user level meets requirement
        if (conditionValue.level && currentLevel >= conditionValue.level) {
          shouldUnlock = true
        }
        break

      case 'quest':
        // Check if quest completion count meets requirement
        if (conditionValue.count && questCompletionCount >= conditionValue.count) {
          shouldUnlock = true
        }
        break

      // Other condition types (streak, attendance, tag) are handled by check-in function
    }

    if (shouldUnlock) {
      // Unlock the title
      const { error: unlockError } = await supabaseClient
        .from('user_titles')
        .insert({
          user_id: userId,
          title_id: title.id,
        })

      if (!unlockError) {
        newTitles.push(title)
      }
    }
  }

  return newTitles
}
