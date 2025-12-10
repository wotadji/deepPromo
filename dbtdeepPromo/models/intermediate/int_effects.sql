{{
    config(
        materialized='table',
        unique_key='date, product_id',
        post_hook=[
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_main_idx ON {{ this }} (date, product_id)",
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_date_idx ON {{ this }} (date)",
            "ANALYZE {{ this }}"
        ]
    )
}}

with joined as (
  select
    p.date,
    p.product_id,
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
