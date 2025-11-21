{{
    config(
        materialized='table',
    )
}}

with joined as (
  select
    p.date,
    {{ select_granularity_columns(var("granularity"), "p") }},
    p.product_id,
    p.product_category,
    p.qty_ana_per,
    p.ana_per,
    p.qty_ref_per,
    p.ref_per
  from {{ ref('int_metrics_per') }} p
),
effects as (
  select
    *,
    ((ana_per / nullif(qty_ana_per,0)) - (ref_per / nullif(qty_ref_per,0))) * qty_ref_per as price_effect_per,
    (qty_ana_per - qty_ref_per) * (ref_per / nullif(qty_ref_per,0)) as quantity_effect_per,
    (qty_ana_per - qty_ref_per) * ((ana_per / nullif(qty_ana_per,0) + ref_per / nullif(qty_ref_per,0))/2) as volume_effect_per
  from joined
)
select * from effects
