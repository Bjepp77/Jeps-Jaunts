-- =============================================================
-- Florist Seasonality Planner — flower seed data
-- 45 flowers across focal / filler / greenery / accent
--
-- in_season_months : peak availability (green in UI)
-- shoulder_months  : limited / transitional (yellow in UI)
-- absent from both : out of season (red in UI)
--
-- Run AFTER 001_init.sql in the Supabase SQL Editor.
-- Safe to re-run: truncates first.
-- =============================================================

TRUNCATE public.flowers RESTART IDENTITY CASCADE;

INSERT INTO public.flowers
  (common_name, category, color_tags, in_season_months, shoulder_months, notes)
VALUES

-- ─── FOCAL ───────────────────────────────────────────────────

('Rose',
 'focal',
 ARRAY['white','red','pink','blush','peach','yellow','coral','lavender'],
 ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
 NULL,
 'Available year-round commercially; true outdoor peak June–October'),

('Peony',
 'focal',
 ARRAY['white','blush','pink','coral','burgundy'],
 ARRAY[4,5,6]::int2[],
 ARRAY[3,7]::int2[],
 'Very short season; book early. Refrigerated stock extends availability slightly'),

('Garden Rose (David Austin)',
 'focal',
 ARRAY['white','blush','peach','yellow','apricot'],
 ARRAY[5,6,7,8,9]::int2[],
 ARRAY[4,10]::int2[],
 'Larger, more ruffled than standard roses; fragrant'),

('Ranunculus',
 'focal',
 ARRAY['white','blush','peach','yellow','red','coral','purple','orange'],
 ARRAY[3,4,5]::int2[],
 ARRAY[2,6]::int2[],
 'Delicate, multi-petaled; handle with care in heat'),

('Dahlia',
 'focal',
 ARRAY['white','peach','coral','burgundy','purple','orange','yellow','red'],
 ARRAY[7,8,9,10]::int2[],
 ARRAY[6,11]::int2[],
 'Wide variety of forms (ball, café au lait, dinner plate). Fall weddings staple'),

('Sunflower',
 'focal',
 ARRAY['yellow','orange','peach','burgundy'],
 ARRAY[6,7,8,9,10]::int2[],
 ARRAY[5,11]::int2[],
 'Dwarf varieties work as filler; standard as focal'),

('Tulip',
 'focal',
 ARRAY['white','pink','purple','red','yellow','orange','peach'],
 ARRAY[3,4,5]::int2[],
 ARRAY[2,6]::int2[],
 'Continues to open after cutting; account for extra movement in arrangements'),

('Anemone',
 'focal',
 ARRAY['white','blush','purple','red','burgundy'],
 ARRAY[11,12,1,2,3,4]::int2[],
 ARRAY[10,5]::int2[],
 'Dramatic dark centers. Cool-season flower; wilts in heat'),

('Lisianthus',
 'focal',
 ARRAY['white','blush','purple','lavender','pink'],
 ARRAY[6,7,8,9]::int2[],
 ARRAY[5,10]::int2[],
 'Resembles rose or peony at fraction of cost; long vase life'),

('Calla Lily',
 'focal',
 ARRAY['white','blush','burgundy','orange','yellow','purple'],
 ARRAY[4,5,6,7]::int2[],
 ARRAY[3,8]::int2[],
 'Sleek, modern look. Standard white available year-round commercially'),

('Oriental Lily',
 'focal',
 ARRAY['white','pink','orange','yellow'],
 ARRAY[6,7,8]::int2[],
 ARRAY[5,9]::int2[],
 'Very fragrant; advise clients with scent sensitivities'),

('Protea',
 'focal',
 ARRAY['blush','peach','red','white','pink'],
 ARRAY[11,12,1,2,3]::int2[],
 ARRAY[10,4]::int2[],
 'Long vase life; bold texture. Imported from South Africa/Hawaii'),

('Hellebore',
 'focal',
 ARRAY['white','blush','purple','burgundy','green'],
 ARRAY[12,1,2,3,4]::int2[],
 ARRAY[11,5]::int2[],
 'Delicate and droopy; condition well. Beloved for winter/early spring weddings'),

('Magnolia Bloom',
 'focal',
 ARRAY['white','cream'],
 ARRAY[3,4,5]::int2[],
 ARRAY[2,6]::int2[],
 'Large, dramatic blooms; very short vase life once open'),

('Sweet William',
 'focal',
 ARRAY['white','pink','red','burgundy','coral'],
 ARRAY[5,6,7]::int2[],
 ARRAY[4,8]::int2[],
 'Clusters of small blooms; spicy-sweet fragrance'),

-- ─── FILLER ──────────────────────────────────────────────────

('Baby''s Breath',
 'filler',
 ARRAY['white','blush'],
 ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
 NULL,
 'Year-round availability; classic airy filler'),

('Waxflower',
 'filler',
 ARRAY['white','blush','purple','pink'],
 ARRAY[11,12,1,2,3]::int2[],
 ARRAY[10,4]::int2[],
 'Long vase life; honey-like scent'),

('Queen Anne''s Lace',
 'filler',
 ARRAY['white','cream'],
 ARRAY[6,7,8]::int2[],
 ARRAY[5,9]::int2[],
 'Wild-foraged feel; budget-friendly filler for summer events'),

('Statice',
 'filler',
 ARRAY['purple','lavender','white','yellow','pink'],
 ARRAY[6,7,8,9]::int2[],
 ARRAY[5,10]::int2[],
 'Dries well; good for keepsakes'),

('Yarrow',
 'filler',
 ARRAY['white','yellow','peach','red'],
 ARRAY[6,7,8]::int2[],
 ARRAY[5,9]::int2[],
 'Flat-top clusters; dries beautifully. Rustic/wildflower aesthetic'),

('Sweet Pea',
 'filler',
 ARRAY['white','blush','pink','purple','lavender','coral'],
 ARRAY[3,4,5]::int2[],
 ARRAY[2,6]::int2[],
 'Highly fragrant; very short vase life — order day-of if possible'),

('Delphinium',
 'filler',
 ARRAY['white','blue','purple','lavender','pink'],
 ARRAY[5,6,7,8]::int2[],
 ARRAY[4,9]::int2[],
 'Tall spikes add vertical interest. Toxic — keep away from children/pets'),

('Larkspur',
 'filler',
 ARRAY['white','pink','purple','blue','lavender'],
 ARRAY[5,6,7]::int2[],
 ARRAY[4,8]::int2[],
 'Annual relative of delphinium; cottage-garden feel'),

('Chamomile',
 'filler',
 ARRAY['white','yellow'],
 ARRAY[6,7,8]::int2[],
 ARRAY[5,9]::int2[],
 'Tiny daisy-like; smells like apple. Whimsical wildflower filler'),

('Forget-Me-Not',
 'filler',
 ARRAY['blue','pink','white'],
 ARRAY[4,5,6]::int2[],
 ARRAY[3,7]::int2[],
 'Delicate clusters of tiny blooms; beloved for spring bouquets'),

-- ─── GREENERY ────────────────────────────────────────────────

('Silver Dollar Eucalyptus',
 'greenery',
 ARRAY['green','silver'],
 ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
 NULL,
 'Round leaves; most popular wedding greenery. Year-round availability'),

('Seeded Eucalyptus',
 'greenery',
 ARRAY['green','silver'],
 ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
 NULL,
 'Wispy texture with tiny seed pods; great trailing greenery'),

('Italian Ruscus',
 'greenery',
 ARRAY['green'],
 ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
 NULL,
 'Sturdy, glossy leaves. Long vase life; great base layer greenery'),

('Salal',
 'greenery',
 ARRAY['green'],
 ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
 NULL,
 'Harvested from Pacific Northwest forests year-round; affordable'),

('Leatherleaf Fern',
 'greenery',
 ARRAY['green'],
 ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
 NULL,
 'Classic floral fern; very long vase life'),

('Olive Branch',
 'greenery',
 ARRAY['green','silver'],
 ARRAY[8,9,10,11]::int2[],
 ARRAY[7,12]::int2[],
 'Mediterranean look; very popular for fall/rustic weddings. Fruit may stain fabrics'),

('Dusty Miller',
 'greenery',
 ARRAY['silver','gray'],
 ARRAY[4,5,6,7,8,9,10]::int2[],
 ARRAY[3,11]::int2[],
 'Silvery velvety leaves; beautiful contrast with white or blush'),

('Lamb''s Ear',
 'greenery',
 ARRAY['silver','gray'],
 ARRAY[4,5,6,7,8]::int2[],
 ARRAY[3,9]::int2[],
 'Soft, tactile leaves; very popular in romantic bridal bouquets'),

('Magnolia Leaf',
 'greenery',
 ARRAY['green','brown'],
 ARRAY[9,10,11,12,1,2]::int2[],
 ARRAY[8,3]::int2[],
 'Large, glossy leaves with brown undersides; dramatic garlands and centerpieces'),

('English Ivy',
 'greenery',
 ARRAY['green'],
 ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::int2[],
 NULL,
 'Classic trailing greenery; great for cascading bouquets and table runners'),

-- ─── ACCENT ──────────────────────────────────────────────────

('Scabiosa',
 'accent',
 ARRAY['white','blush','purple','lavender','pink'],
 ARRAY[6,7,8,9,10]::int2[],
 ARRAY[5,11]::int2[],
 'Pincushion-shaped; delicate and airy. Also called pincushion flower'),

('Veronica (Speedwell)',
 'accent',
 ARRAY['white','purple','blue','pink'],
 ARRAY[5,6,7,8,9]::int2[],
 ARRAY[4,10]::int2[],
 'Tall slender spikes; adds texture and height'),

('Amaranthus',
 'accent',
 ARRAY['burgundy','green','red','orange'],
 ARRAY[8,9,10,11]::int2[],
 ARRAY[7,12]::int2[],
 'Dramatic drooping plumes or upright; great for fall/moody arrangements'),

('Celosia',
 'accent',
 ARRAY['red','orange','yellow','pink','burgundy','coral'],
 ARRAY[7,8,9,10]::int2[],
 ARRAY[6,11]::int2[],
 'Velvety brain or feathery plume forms; bold texture and color'),

('Hypericum Berry',
 'accent',
 ARRAY['red','white','peach','green','burgundy'],
 ARRAY[8,9,10,11]::int2[],
 ARRAY[7,12]::int2[],
 'Small round berries on arching stems; great filler-accent hybrid'),

('Nigella',
 'accent',
 ARRAY['blue','white','pink','purple'],
 ARRAY[5,6,7]::int2[],
 ARRAY[4,8]::int2[],
 'Also called Love-in-a-Mist; spidery bracts give whimsical look'),

('Muscari (Grape Hyacinth)',
 'accent',
 ARRAY['blue','purple','white'],
 ARRAY[3,4,5]::int2[],
 ARRAY[2,6]::int2[],
 'Tiny cobalt clusters; striking contrast in spring bouquets'),

('Fritillaria',
 'accent',
 ARRAY['purple','white','orange','green'],
 ARRAY[3,4,5]::int2[],
 ARRAY[2,6]::int2[],
 'Bell-shaped nodding blooms; unusual, editorial look'),

('Tweedia',
 'accent',
 ARRAY['blue','white','lavender'],
 ARRAY[4,5,6,7,8]::int2[],
 ARRAY[3,9]::int2[],
 'One of the few truly blue flowers; small starry blooms'),

('Chocolate Cosmos',
 'accent',
 ARRAY['burgundy','chocolate','deep-red'],
 ARRAY[7,8,9,10]::int2[],
 ARRAY[6,11]::int2[],
 'Rich, dark velvety blooms; faint chocolate scent. Moody/dramatic aesthetic'),

('Viburnum Berry',
 'accent',
 ARRAY['white','green','red','black'],
 ARRAY[9,10,11]::int2[],
 ARRAY[8,12]::int2[],
 'Clusters of berries; seasonal fall accent. Also available as snowball blooms in spring');
