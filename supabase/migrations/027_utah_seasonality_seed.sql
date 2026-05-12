-- =============================================================
-- 027_utah_seasonality_seed.sql
-- Regional seasonality data for Utah / Mountain West (Zone 6b)
--
-- Sources:
--   Mayesh Monthly Product Guide
--   FiftyFlowers Wholesale Availability Charts
--   DVFlora Flower Availability by Month
--   Blooms By The Box Seasonal Chart
--   Expoflores (Ecuador) export data
--   Utah Flower Farms / Utah Cut Flower Association
--
-- Context:
--   Utah growing season: May–October
--   First frost: mid-October, last frost: mid-May
--   Elevation ~4,500 ft, USDA Zone 6b
--   Primary wholesale sources: Ecuador imports, California,
--   Dutch/Netherlands, Pacific Northwest, local Utah growers
--
-- The base flower table (seed.sql) has generic US-wide seasonality.
-- This migration adds Utah-specific regional overrides that account
-- for what's actually available through wholesale in the Mountain West.
--
-- in_season_months  = reliably available, competitive pricing
-- shoulder_months   = available but limited supply or higher cost
--
-- Safe to re-run: uses ON CONFLICT to upsert.
-- =============================================================

-- Ensure the Utah region exists
INSERT INTO public.regions (name, slug)
VALUES ('Utah / Mountain West', 'utah')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Upsert regional seasonality for each flower
-- Uses a CTE to look up flower IDs by common_name and region by slug

WITH
  r AS (SELECT id FROM public.regions WHERE slug = 'utah'),
  flower_data (common_name, in_season_months, shoulder_months) AS (VALUES

    -- ═══ FOCAL ═══════════════════════════════════════════════════

    -- Rose: Year-round from Ecuador/Colombia. Domestic peak June-Oct.
    -- Price spikes around Valentine's (Feb) and Mother's Day (May).
    ('Rose',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Peony: Tight domestic window May-June (Utah local late May-June).
    -- Southern Hemisphere imports (Chile Oct-Dec, NZ Nov-Feb) extend into fall/winter.
    -- Gap: mid-Aug through Sep is a dead zone — even imports scarce.
    ('Peony',
     ARRAY[5,6]::int2[],
     ARRAY[4,7,10,11,12,1,2]::int2[]),

    -- Garden Rose (David Austin): CA + Ecuador year-round but quality peaks summer.
    -- Utah-area availability best May-Oct. Winter supply smaller, pricier.
    ('Garden Rose (David Austin)',
     ARRAY[5,6,7,8,9,10]::int2[],
     ARRAY[3,4,11,12]::int2[]),

    -- Ranunculus: CA production Jan-May. Ecuador extending season.
    -- Virtually unavailable July-Nov in wholesale.
    ('Ranunculus',
     ARRAY[1,2,3,4,5]::int2[],
     ARRAY[6,12]::int2[]),

    -- Dahlia: Local Utah July-Oct. CA extends to June, Nov.
    -- Not available wholesale Dec-May (imports minimal).
    ('Dahlia',
     ARRAY[7,8,9,10]::int2[],
     ARRAY[6,11]::int2[]),

    -- Sunflower: Year-round from CA/Netherlands/global.
    -- Peak domestic supply June-Sept. Available but pricier in winter.
    ('Sunflower',
     ARRAY[5,6,7,8,9,10]::int2[],
     ARRAY[3,4,11,12]::int2[]),

    -- Tulip: Dutch imports Nov-May are the backbone. Summer available but poor quality.
    ('Tulip',
     ARRAY[11,12,1,2,3,4,5]::int2[],
     ARRAY[6,10]::int2[]),

    -- Anemone: Cool-season. CA + imports Oct-May. Wilts in summer heat.
    ('Anemone',
     ARRAY[10,11,12,1,2,3,4,5]::int2[],
     ARRAY[9,6]::int2[]),

    -- Lisianthus: Year-round from Colombia/CA/Netherlands. Reliable supply.
    ('Lisianthus',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Calla Lily: Year-round from Ecuador/Colombia. CA peak Feb-Oct.
    ('Calla Lily',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Oriental Lily: Year-round wholesale from CA/Netherlands/South America.
    ('Oriental Lily',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Protea: South Africa export Sept-Jan peak. Limited spring/summer.
    ('Protea',
     ARRAY[9,10,11,12,1]::int2[],
     ARRAY[2,3,4,5]::int2[]),

    -- Hellebore: European imports + limited domestic. Late winter-spring.
    -- Very limited availability; specialty item.
    ('Hellebore',
     ARRAY[1,2,3,4]::int2[],
     ARRAY[11,12,5]::int2[]),

    -- Magnolia Bloom: Seasonal tree crop. Spring flush most reliable.
    -- Very short vase life limits wholesale viability.
    ('Magnolia Bloom',
     ARRAY[3,4,5]::int2[],
     ARRAY[2,6]::int2[]),

    -- Sweet William: CA/domestic spring-summer. Available but less common in winter.
    ('Sweet William',
     ARRAY[4,5,6,7,8]::int2[],
     ARRAY[3,9]::int2[]),


    -- ═══ FILLER ══════════════════════════════════════════════════

    -- Baby's Breath (Gypsophila): Year-round from Ecuador/Colombia/Netherlands.
    ('Baby''s Breath',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Waxflower: CA/Australia. Primary window late fall-spring.
    -- Limited summer availability.
    ('Waxflower',
     ARRAY[10,11,12,1,2,3,4]::int2[],
     ARRAY[5,9]::int2[]),

    -- Queen Anne's Lace (Ammi): Domestic specialty farms, some year-round.
    -- Best availability late spring-summer.
    ('Queen Anne''s Lace',
     ARRAY[5,6,7,8,9]::int2[],
     ARRAY[4,10]::int2[]),

    -- Statice: Year-round from global wholesale sources.
    ('Statice',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Yarrow: Domestic summer peak. Limited off-season.
    ('Yarrow',
     ARRAY[6,7,8]::int2[],
     ARRAY[5,9,10]::int2[]),

    -- Sweet Pea: CA production winter-spring. Extremely fragrant, very short vase life.
    -- Summer sweet peas exist but are a different season.
    ('Sweet Pea',
     ARRAY[2,3,4,5]::int2[],
     ARRAY[1,6]::int2[]),

    -- Delphinium: Year-round from CA/Netherlands. Reliable wholesale.
    ('Delphinium',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Larkspur: More seasonal than delphinium. CA/local spring-summer.
    -- Utah local growers can produce June-Aug.
    ('Larkspur',
     ARRAY[5,6,7]::int2[],
     ARRAY[4,8]::int2[]),

    -- Chamomile: Domestic spring-summer only. No meaningful off-season supply.
    ('Chamomile',
     ARRAY[5,6,7,8]::int2[],
     ARRAY[4,9]::int2[]),

    -- Forget-Me-Not: Very short spring window. Extremely limited wholesale.
    ('Forget-Me-Not',
     ARRAY[4,5]::int2[],
     ARRAY[3,6]::int2[]),


    -- ═══ GREENERY ════════════════════════════════════════════════

    -- Silver Dollar Eucalyptus: Year-round from CA/Australia. Standard stock.
    ('Silver Dollar Eucalyptus',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Seeded Eucalyptus: Year-round. CA/Australia.
    ('Seeded Eucalyptus',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Italian Ruscus: Year-round. CA/Spain/Israel.
    ('Italian Ruscus',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Salal: Year-round from Pacific Northwest.
    ('Salal',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Leatherleaf Fern: Year-round. Global wholesale standard.
    ('Leatherleaf Fern',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Olive Branch: Mediterranean/CA. Year-round but winter supply tighter.
    ('Olive Branch',
     ARRAY[4,5,6,7,8,9,10,11]::int2[],
     ARRAY[3,12]::int2[]),

    -- Dusty Miller: Year-round from CA/global. Consistent supply.
    ('Dusty Miller',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Lamb's Ear: Year-round wholesale. Slightly better spring-fall.
    ('Lamb''s Ear',
     ARRAY[3,4,5,6,7,8,9,10]::int2[],
     ARRAY[1,2,11,12]::int2[]),

    -- Magnolia Leaf: Year-round from specialty suppliers.
    -- Larger, fuller branches spring-fall. Smaller in winter.
    ('Magnolia Leaf',
     ARRAY[4,5,6,7,8,9,10,11]::int2[],
     ARRAY[1,2,3,12]::int2[]),

    -- English Ivy: Year-round. Standard trailing greenery.
    ('English Ivy',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),


    -- ═══ ACCENT ══════════════════════════════════════════════════

    -- Scabiosa: Year-round from specialty wholesale, peaks summer-fall.
    ('Scabiosa',
     ARRAY[5,6,7,8,9,10]::int2[],
     ARRAY[4,11]::int2[]),

    -- Veronica: Summer-autumn peak. Limited spring.
    ('Veronica (Speedwell)',
     ARRAY[5,6,7,8,9]::int2[],
     ARRAY[4,10]::int2[]),

    -- Amaranthus: Summer-fall. Warm-climate imports extend slightly.
    ('Amaranthus',
     ARRAY[7,8,9,10,11]::int2[],
     ARRAY[6,12]::int2[]),

    -- Celosia: Summer-fall. Specialty wholesale.
    ('Celosia',
     ARRAY[7,8,9,10]::int2[],
     ARRAY[6,11]::int2[]),

    -- Hypericum Berry: Berry stage peaks fall. Green berries available summer.
    ('Hypericum Berry',
     ARRAY[7,8,9,10,11,12]::int2[],
     ARRAY[6,1]::int2[]),

    -- Nigella: Spring-summer. Limited off-season.
    ('Nigella',
     ARRAY[4,5,6,7,8]::int2[],
     ARRAY[3,9]::int2[]),

    -- Muscari: Spring bulb crop only. Dutch imports.
    ('Muscari (Grape Hyacinth)',
     ARRAY[2,3,4,5]::int2[],
     ARRAY[1,6]::int2[]),

    -- Fritillaria: Spring bulb crop only. Dutch imports.
    ('Fritillaria',
     ARRAY[3,4,5]::int2[],
     ARRAY[2,6]::int2[]),

    -- Tweedia: Year-round from South America specialty growers.
    ('Tweedia',
     ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
     NULL::int2[]),

    -- Chocolate Cosmos: Summer-fall. Specialty item, limited supply.
    ('Chocolate Cosmos',
     ARRAY[7,8,9,10]::int2[],
     ARRAY[6,11]::int2[]),

    -- Viburnum Berry: Berries ripen fall-winter. Spring has snowball blooms.
    ('Viburnum Berry',
     ARRAY[9,10,11,12]::int2[],
     ARRAY[3,4,5,8]::int2[])

  )

INSERT INTO public.region_flower_seasonality
  (region_id, flower_id, in_season_months, shoulder_months)
SELECT
  r.id,
  f.id,
  fd.in_season_months,
  COALESCE(fd.shoulder_months, ARRAY[]::int2[])
FROM flower_data fd
JOIN public.flowers f ON f.common_name = fd.common_name
CROSS JOIN r
ON CONFLICT (region_id, flower_id)
DO UPDATE SET
  in_season_months = EXCLUDED.in_season_months,
  shoulder_months  = EXCLUDED.shoulder_months,
  updated_at       = now();


-- =============================================================
-- Source tagging: primary wholesale source per flower
-- This uses the notes field on the flowers table to add source info.
-- A proper flower_sources table would be better long-term, but this
-- gets the data into the system without a new migration dependency.
-- =============================================================

-- Update flower notes to include primary source for Utah market
UPDATE public.flowers SET notes = notes || ' [Source: Ecuador/Colombia year-round]'
WHERE common_name = 'Rose' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Domestic May-Jun; NZ/Chile Oct-Feb import]'
WHERE common_name = 'Peony' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/Ecuador]'
WHERE common_name = 'Garden Rose (David Austin)' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California Jan-May; Ecuador extending]'
WHERE common_name = 'Ranunculus' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Local Utah Jul-Oct; California]'
WHERE common_name = 'Dahlia' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/Netherlands/global]'
WHERE common_name = 'Sunflower' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Netherlands Nov-May]'
WHERE common_name = 'Tulip' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/South America]'
WHERE common_name = 'Anemone' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Colombia/California/Netherlands year-round]'
WHERE common_name = 'Lisianthus' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Ecuador/Colombia year-round]'
WHERE common_name = 'Calla Lily' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/Netherlands/South America year-round]'
WHERE common_name = 'Oriental Lily' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: South Africa Sep-Jan]'
WHERE common_name = 'Protea' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: European imports; limited domestic]'
WHERE common_name = 'Hellebore' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Local ornamental; seasonal tree crop]'
WHERE common_name = 'Magnolia Bloom' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/domestic]'
WHERE common_name = 'Sweet William' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Ecuador/Colombia/Netherlands year-round]'
WHERE common_name = 'Baby''s Breath' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/Australia]'
WHERE common_name = 'Waxflower' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Domestic specialty farms]'
WHERE common_name = 'Queen Anne''s Lace' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Global wholesale year-round]'
WHERE common_name = 'Statice' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Domestic summer]'
WHERE common_name = 'Yarrow' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California winter-spring]'
WHERE common_name = 'Sweet Pea' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/Netherlands year-round]'
WHERE common_name = 'Delphinium' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/local Utah growers]'
WHERE common_name = 'Larkspur' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Domestic spring-summer only]'
WHERE common_name = 'Chamomile' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Domestic; very limited wholesale]'
WHERE common_name = 'Forget-Me-Not' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/Australia year-round]'
WHERE common_name = 'Silver Dollar Eucalyptus' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/Australia year-round]'
WHERE common_name = 'Seeded Eucalyptus' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/Spain/Israel year-round]'
WHERE common_name = 'Italian Ruscus' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Pacific Northwest year-round]'
WHERE common_name = 'Salal' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Global wholesale year-round]'
WHERE common_name = 'Leatherleaf Fern' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Mediterranean/California]'
WHERE common_name = 'Olive Branch' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/global year-round]'
WHERE common_name = 'Dusty Miller' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Domestic/California]'
WHERE common_name = 'Lamb''s Ear' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Specialty suppliers year-round]'
WHERE common_name = 'Magnolia Leaf' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Domestic/California year-round]'
WHERE common_name = 'English Ivy' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/domestic summer-fall]'
WHERE common_name = 'Scabiosa' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/domestic summer]'
WHERE common_name = 'Veronica (Speedwell)' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Warm-climate imports/domestic]'
WHERE common_name = 'Amaranthus' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/warm climates]'
WHERE common_name = 'Celosia' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/global]'
WHERE common_name = 'Hypericum Berry' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California/domestic]'
WHERE common_name = 'Nigella' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Netherlands/imports spring only]'
WHERE common_name = 'Muscari (Grape Hyacinth)' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Netherlands/imports spring only]'
WHERE common_name = 'Fritillaria' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: South America year-round]'
WHERE common_name = 'Tweedia' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: California specialty summer-fall]'
WHERE common_name = 'Chocolate Cosmos' AND notes NOT LIKE '%Source:%';

UPDATE public.flowers SET notes = notes || ' [Source: Domestic ornamental fall-winter]'
WHERE common_name = 'Viburnum Berry' AND notes NOT LIKE '%Source:%';
