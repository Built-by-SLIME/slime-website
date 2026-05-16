import { createClient } from '@supabase/supabase-js'

// GET /api/slabs/check?wallet=0.0.xxxxx
// Returns which SLIME serials this wallet has already claimed a Slab for.
//
// Required Supabase table — run once in Supabase SQL editor:
//
//   create table slab_claims (
//     id uuid default gen_random_uuid() primary key,
//     slime_serial integer unique not null,
//     claimed_by text not null,
//     claimed_at timestamptz default now() not null,
//     payment_tx_id text not null,
//     slab_tx_ids text[] default '{}' not null
//   );
//   alter table slab_claims enable row level security;
//   create policy "Public read slab_claims" on slab_claims for select using (true);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { wallet } = req.query
  if (!wallet) return res.status(400).json({ error: 'Missing wallet parameter' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server not configured' })

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase
    .from('slab_claims')
    .select('slime_serial')
    .eq('claimed_by', wallet)

  if (error) return res.status(500).json({ error: 'Database error' })

  return res.status(200).json({
    claimedSerials: (data || []).map(r => r.slime_serial),
  })
}
