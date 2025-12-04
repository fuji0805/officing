/**
 * Check-in Edge Function
 * 
 * チェックイン処理を実行し、報酬とアンロックを計算
 * Requirements: 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 5.1, 5.2, 6.1
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckinRequest {
  tag: string
  timestamp?: string
}

interface CheckinResponse {
  success: boolean
  error?: string
  attendance?: any
  rewards?: {
    ticketsEarned: number
    xpEarned: number
    pointsEarned: number
    levelUp: boolean
    newLevel?: number
    monthlyCount: number
    streak: {
      current: number
      max: number
      isNewRecord: boolean
    }
  }
  newTitles?: any[]
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
    const body: CheckinRequest = await req.json()
    const tag = body.tag || 'office'
    const timestamp = body.timestamp || new Date().toISOString()
    const checkInDate = timestamp.split('T')[0] // YYYY-MM-DD
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    // Check for duplicate check-in (same day)
    const { data: existingCheckin, error: duplicateError } = await supabaseClient
      .from('attendances')
      .select('id')
      .eq('user_id', user.id)
      .eq('check_in_date', checkInDate)
      .limit(1)

    if (duplicateError) {
      throw duplicateError
    }

    if (existingCheckin && existingCheckin.length > 0) {
      console.log('Duplicate check-in detected for user:', user.id)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Already checked in today',
          isDuplicate: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create attendance record
    const { data: attendance, error: attendanceError } = await supabaseClient
      .from('attendances')
      .insert({
        user_id: user.id,
        check_in_date: checkInDate,
        check_in_time: timestamp,
        tag: tag,
        month: month,
        year: year,
      })
      .select()
      .single()

    if (attendanceError) {
      throw attendanceError
    }

    // Get monthly count
    const { data: monthlyAttendances, error: monthlyError } = await supabaseClient
      .from('attendances')
      .select('id')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)

    if (monthlyError) {
      throw monthlyError
    }

    const monthlyCount = monthlyAttendances?.length || 0

    // Calculate and update streak
    const streakResult = await updateStreak(supabaseClient, user.id, checkInDate)

    // Grant base rewards (XP, points, ticket)
    const baseRewards = await grantBaseRewards(supabaseClient, user.id)

    // Check for lottery ticket rewards (4, 8, 12 check-ins)
    const bonusTickets = await checkAndGrantBonusTickets(
      supabaseClient,
      user.id,
      monthlyCount
    )

    // Check for title unlocks
    const newTitles = await checkAndUnlockTitles(
      supabaseClient,
      user.id,
      monthlyCount,
      streakResult.current,
      tag
    )

    const response: CheckinResponse = {
      success: true,
      attendance,
      rewards: {
        ticketsEarned: 1 + bonusTickets, // 基本1枚 + ボーナス
        xpEarned: baseRewards.xp,
        pointsEarned: baseRewards.points,
        levelUp: baseRewards.levelUp,
        newLevel: baseRewards.newLevel,
        monthlyCount,
        streak: streakResult,
      },
      newTitles,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Check-in error:', error)
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
 * Calculate and update user streak
 * Requirements: 5.1, 5.2
 */
async function updateStreak(
  supabaseClient: any,
  userId: string,
  currentDate: string
): Promise<{ current: number; max: number; isNewRecord: boolean }> {
  // Get current user progress
  const { data: progress, error: progressError } = await supabaseClient
    .from('user_progress')
    .select('current_streak, max_streak')
    .eq('user_id', userId)
    .single()

  if (progressError && progressError.code !== 'PGRST116') {
    throw progressError
  }

  // Create user_progress if it doesn't exist
  if (!progress) {
    const { error: createError } = await supabaseClient
      .from('user_progress')
      .insert({
        user_id: userId,
        level: 1,
        current_xp: 0,
        total_points: 0,
        current_streak: 1,
        max_streak: 1,
        pity_counter: 0,
      })

    if (createError) {
      throw createError
    }

    return { current: 1, max: 1, isNewRecord: true }
  }

  const currentStreak = progress.current_streak || 0
  const maxStreak = progress.max_streak || 0

  // Calculate yesterday's date
  const current = new Date(currentDate)
  const yesterday = new Date(current)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Check if user checked in yesterday
  const { data: yesterdayCheckin, error: yesterdayError } = await supabaseClient
    .from('attendances')
    .select('id')
    .eq('user_id', userId)
    .eq('check_in_date', yesterdayStr)
    .limit(1)

  if (yesterdayError) {
    throw yesterdayError
  }

  // Calculate new streak
  let newStreak: number
  if (yesterdayCheckin && yesterdayCheckin.length > 0) {
    // Consecutive day - increment streak
    newStreak = currentStreak + 1
  } else {
    // Gap in attendance - reset streak
    newStreak = 1
  }

  const newMaxStreak = Math.max(newStreak, maxStreak)

  // Update user_progress
  const { error: updateError } = await supabaseClient
    .from('user_progress')
    .update({
      current_streak: newStreak,
      max_streak: newMaxStreak,
    })
    .eq('user_id', userId)

  if (updateError) {
    throw updateError
  }

  return {
    current: newStreak,
    max: newMaxStreak,
    isNewRecord: newStreak > maxStreak,
  }
}

/**
 * Grant base rewards for check-in (XP, points, ticket)
 */
async function grantBaseRewards(
  supabaseClient: any,
  userId: string
): Promise<{ xp: number; points: number; levelUp: boolean; newLevel?: number }> {
  const BASE_XP = 50 // チェックインで獲得する経験値
  const BASE_POINTS = 10 // チェックインで獲得するポイント
  const BASE_TICKETS = 1 // チェックインで獲得するチケット

  // Get current user progress
  const { data: progress, error: progressError } = await supabaseClient
    .from('user_progress')
    .select('level, current_xp, total_points')
    .eq('user_id', userId)
    .single()

  if (progressError && progressError.code !== 'PGRST116') {
    throw progressError
  }

  const currentLevel = progress?.level || 1
  const currentXP = progress?.current_xp || 0
  const currentPoints = progress?.total_points || 0

  // Calculate new XP and check for level up
  const newXP = currentXP + BASE_XP
  const xpForNextLevel = Math.floor(100 * Math.pow(currentLevel, 1.5))
  
  let levelUp = false
  let newLevel = currentLevel
  let finalXP = newXP

  if (newXP >= xpForNextLevel) {
    levelUp = true
    newLevel = currentLevel + 1
    finalXP = newXP - xpForNextLevel // 余剰XPを次のレベルに繰り越し
  }

  // Update user progress
  const { error: updateError } = await supabaseClient
    .from('user_progress')
    .update({
      level: newLevel,
      current_xp: finalXP,
      total_points: currentPoints + BASE_POINTS,
    })
    .eq('user_id', userId)

  if (updateError) {
    throw updateError
  }

  // Grant lottery ticket
  const { data: existingTickets, error: fetchError } = await supabaseClient
    .from('lottery_tickets')
    .select('ticket_count')
    .eq('user_id', userId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError
  }

  if (!existingTickets) {
    // Create new record
    await supabaseClient
      .from('lottery_tickets')
      .insert({
        user_id: userId,
        ticket_count: BASE_TICKETS,
        earned_from: 'checkin',
      })
  } else {
    // Update existing record
    await supabaseClient
      .from('lottery_tickets')
      .update({
        ticket_count: existingTickets.ticket_count + BASE_TICKETS,
      })
      .eq('user_id', userId)
  }

  return {
    xp: BASE_XP,
    points: BASE_POINTS,
    levelUp,
    newLevel: levelUp ? newLevel : undefined,
  }
}

/**
 * Check and grant bonus lottery tickets based on monthly count
 * Requirements: 3.1, 3.2, 3.3
 */
async function checkAndGrantBonusTickets(
  supabaseClient: any,
  userId: string,
  monthlyCount: number
): Promise<number> {
  const ticketMilestones = [4, 8, 12]
  let ticketsToGrant = 0

  // Check which milestones were just reached
  for (const milestone of ticketMilestones) {
    if (monthlyCount === milestone) {
      ticketsToGrant++
    }
  }

  if (ticketsToGrant === 0) {
    return 0
  }

  // Get or create lottery_tickets record
  const { data: existingTickets, error: fetchError } = await supabaseClient
    .from('lottery_tickets')
    .select('ticket_count')
    .eq('user_id', userId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError
  }

  if (!existingTickets) {
    // Create new record
    const { error: createError } = await supabaseClient
      .from('lottery_tickets')
      .insert({
        user_id: userId,
        ticket_count: ticketsToGrant,
        earned_from: `${monthlyCount}_checkins`,
      })

    if (createError) {
      throw createError
    }
  } else {
    // Update existing record
    const { error: updateError } = await supabaseClient
      .from('lottery_tickets')
      .update({
        ticket_count: existingTickets.ticket_count + ticketsToGrant,
        earned_from: `${monthlyCount}_checkins`,
      })
      .eq('user_id', userId)

    if (updateError) {
      throw updateError
    }
  }

  return ticketsToGrant
}

/**
 * Check and unlock titles based on achievements
 * Requirements: 6.1
 */
async function checkAndUnlockTitles(
  supabaseClient: any,
  userId: string,
  monthlyCount: number,
  currentStreak: number,
  tag: string
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

  // Get user level for level-based titles
  const { data: progress } = await supabaseClient
    .from('user_progress')
    .select('level')
    .eq('user_id', userId)
    .single()

  const userLevel = progress?.level || 1

  // Get total attendance count for attendance-based titles
  const { data: totalAttendances } = await supabaseClient
    .from('attendances')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)

  const totalAttendanceCount = totalAttendances?.length || 0

  // Get tag-specific attendance count
  const { data: tagAttendances } = await supabaseClient
    .from('attendances')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('tag', tag)

  const tagAttendanceCount = tagAttendances?.length || 0

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
      case 'streak':
        // Check if current streak meets requirement
        if (conditionValue.threshold && currentStreak >= conditionValue.threshold) {
          shouldUnlock = true
        }
        break

      case 'attendance':
        // Check if total attendance meets requirement
        if (conditionValue.count && totalAttendanceCount >= conditionValue.count) {
          shouldUnlock = true
        }
        break

      case 'level':
        // Check if user level meets requirement
        if (conditionValue.level && userLevel >= conditionValue.level) {
          shouldUnlock = true
        }
        break

      case 'tag':
        // Check if tag-specific attendance meets requirement
        if (
          conditionValue.tag === tag &&
          conditionValue.count &&
          tagAttendanceCount >= conditionValue.count
        ) {
          shouldUnlock = true
        }
        break
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
