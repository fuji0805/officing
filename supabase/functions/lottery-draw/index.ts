/**
 * Lottery Draw Edge Function
 * 
 * くじ抽選処理を実行し、景品を付与
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LotteryDrawResponse {
  success: boolean
  error?: string
  prize?: any
  rank?: string
  pityCounter?: number
  ticketsRemaining?: number
}

// Pity system configuration
const PITY_THRESHOLD = 10 // Guarantee A or higher after 10 draws without A/S

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check and consume lottery ticket
    const ticketResult = await consumeTicket(supabaseClient, user.id)
    if (!ticketResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: ticketResult.error || 'Insufficient tickets',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get current pity counter
    const pityCounter = await getPityCounter(supabaseClient, user.id)

    // Execute weighted lottery draw
    const prize = await executeLotteryDraw(
      supabaseClient,
      user.id,
      pityCounter
    )

    if (!prize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No available prizes',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update prize inventory if needed
    await updatePrizeInventory(supabaseClient, prize.id, prize.stock)

    // Apply prize rewards
    await applyPrizeRewards(supabaseClient, user.id, prize)

    // Update pity counter
    const newPityCounter = await updatePityCounter(
      supabaseClient,
      user.id,
      prize.rank,
      pityCounter
    )

    // Log lottery draw
    await logLotteryDraw(
      supabaseClient,
      user.id,
      prize.id,
      prize.rank,
      pityCounter
    )

    const response: LotteryDrawResponse = {
      success: true,
      prize,
      rank: prize.rank,
      pityCounter: newPityCounter,
      ticketsRemaining: ticketResult.remainingTickets,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Lottery draw error:', error)
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
 * Consume one lottery ticket
 * Requirements: 4.1
 */
async function consumeTicket(
  supabaseClient: any,
  userId: string
): Promise<{ success: boolean; error?: string; remainingTickets?: number }> {
  // Get current ticket count
  const { data: ticketData, error: fetchError } = await supabaseClient
    .from('lottery_tickets')
    .select('ticket_count')
    .eq('user_id', userId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // No ticket record exists
      return { success: false, error: 'No tickets available' }
    }
    throw fetchError
  }

  const currentTickets = ticketData?.ticket_count || 0

  if (currentTickets <= 0) {
    return { success: false, error: 'Insufficient tickets' }
  }

  // Consume one ticket
  const { error: updateError } = await supabaseClient
    .from('lottery_tickets')
    .update({
      ticket_count: currentTickets - 1,
    })
    .eq('user_id', userId)

  if (updateError) {
    throw updateError
  }

  return { success: true, remainingTickets: currentTickets - 1 }
}

/**
 * Get current pity counter
 * Requirements: 4.4
 */
async function getPityCounter(
  supabaseClient: any,
  userId: string
): Promise<number> {
  const { data, error } = await supabaseClient
    .from('user_progress')
    .select('pity_counter')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Create user_progress if it doesn't exist
      await supabaseClient.from('user_progress').insert({
        user_id: userId,
        level: 1,
        current_xp: 0,
        total_points: 0,
        current_streak: 0,
        max_streak: 0,
        pity_counter: 0,
      })
      return 0
    }
    throw error
  }

  return data?.pity_counter || 0
}

/**
 * Execute weighted lottery draw with pity system
 * Requirements: 4.2, 4.3, 4.4
 */
async function executeLotteryDraw(
  supabaseClient: any,
  userId: string,
  pityCounter: number
): Promise<any> {
  // Get all available prizes
  const { data: prizes, error: prizesError } = await supabaseClient
    .from('prizes')
    .select('*')
    .eq('is_available', true)

  if (prizesError) {
    throw prizesError
  }

  if (!prizes || prizes.length === 0) {
    return null
  }

  // Filter out prizes with zero stock
  const availablePrizes = prizes.filter(
    (p: any) => p.stock === null || p.stock > 0
  )

  if (availablePrizes.length === 0) {
    return null
  }

  // Apply pity system: guarantee A or higher after threshold
  let eligiblePrizes = availablePrizes
  if (pityCounter >= PITY_THRESHOLD) {
    eligiblePrizes = availablePrizes.filter(
      (p: any) => p.rank === 'S' || p.rank === 'A'
    )
    
    // If no A/S prizes available, use all available prizes
    if (eligiblePrizes.length === 0) {
      eligiblePrizes = availablePrizes
    }
  }

  // Calculate total weight
  const totalWeight = eligiblePrizes.reduce(
    (sum: number, p: any) => sum + p.weight,
    0
  )

  // Weighted random selection
  let random = Math.random() * totalWeight
  let selectedPrize = eligiblePrizes[0]

  for (const prize of eligiblePrizes) {
    random -= prize.weight
    if (random <= 0) {
      selectedPrize = prize
      break
    }
  }

  return selectedPrize
}

/**
 * Update prize inventory
 * Requirements: 4.3
 */
async function updatePrizeInventory(
  supabaseClient: any,
  prizeId: string,
  currentStock: number | null
): Promise<void> {
  // Skip if unlimited stock (null)
  if (currentStock === null) {
    return
  }

  const newStock = currentStock - 1

  // Update stock
  const updateData: any = { stock: newStock }

  // Mark as unavailable if stock reaches zero
  if (newStock <= 0) {
    updateData.is_available = false
  }

  const { error } = await supabaseClient
    .from('prizes')
    .update(updateData)
    .eq('id', prizeId)

  if (error) {
    throw error
  }
}

/**
 * Apply prize rewards to user
 * Requirements: 4.1
 */
async function applyPrizeRewards(
  supabaseClient: any,
  userId: string,
  prize: any
): Promise<void> {
  const rewardType = prize.reward_type
  const rewardValue = prize.reward_value

  switch (rewardType) {
    case 'points':
      // Grant points
      const pointsToAdd = rewardValue?.amount || 0
      if (pointsToAdd > 0) {
        const { data: progress } = await supabaseClient
          .from('user_progress')
          .select('total_points')
          .eq('user_id', userId)
          .single()

        const currentPoints = progress?.total_points || 0

        await supabaseClient
          .from('user_progress')
          .update({
            total_points: currentPoints + pointsToAdd,
          })
          .eq('user_id', userId)
      }
      break

    case 'title':
      // Unlock title (if title exists in titles table)
      const titleName = rewardValue?.title_name
      if (titleName) {
        const { data: titleData } = await supabaseClient
          .from('titles')
          .select('id')
          .eq('name', titleName)
          .single()

        if (titleData) {
          // Check if user already has this title
          const { data: existingTitle } = await supabaseClient
            .from('user_titles')
            .select('id')
            .eq('user_id', userId)
            .eq('title_id', titleData.id)
            .single()

          if (!existingTitle) {
            await supabaseClient.from('user_titles').insert({
              user_id: userId,
              title_id: titleData.id,
            })
          }
        }
      }
      break

    case 'stamp':
    case 'item':
      // These are handled by the client or stored separately
      // No database update needed here
      break
  }
}

/**
 * Update pity counter
 * Requirements: 4.4
 */
async function updatePityCounter(
  supabaseClient: any,
  userId: string,
  prizeRank: string,
  currentPityCounter: number
): Promise<number> {
  let newPityCounter: number

  // Reset pity counter if A or S rank is drawn
  if (prizeRank === 'A' || prizeRank === 'S') {
    newPityCounter = 0
  } else {
    // Increment pity counter for B or C rank
    newPityCounter = currentPityCounter + 1
  }

  const { error } = await supabaseClient
    .from('user_progress')
    .update({
      pity_counter: newPityCounter,
    })
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return newPityCounter
}

/**
 * Log lottery draw to lottery_log table
 * Requirements: 4.5
 */
async function logLotteryDraw(
  supabaseClient: any,
  userId: string,
  prizeId: string,
  rank: string,
  pityCounterAtDraw: number
): Promise<void> {
  const { error } = await supabaseClient.from('lottery_log').insert({
    user_id: userId,
    prize_id: prizeId,
    rank: rank,
    pity_counter_at_draw: pityCounterAtDraw,
  })

  if (error) {
    throw error
  }
}
