{{
    config(
        materialized='table',
        unique_key=['date', 'product_id'],
        post_hook=[
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_main_idx ON {{ this }} (date, product_id)",
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_date_idx ON {{ this }} (date)",
            "ANALYZE {{ this }}"
        ]
    )
}}

select
  p.date,
  extract(year from p.date) as year,
  extract(month from p.date) as month,
  p.product_id,
  p.qty_ana_per,
  p.ana_per,
  p.qty_ref_per,
  p.ref_per,
  p.contrib_per,
  p.contrib_ref_per,
  p.ana_margin_price,
  y.ana_ytd,
  y.ref_ytd,
  y.perf_ytd,
  y.perf_ref_ytd,
  y.perf_var_ytd,
  y.achievement_rate_ytd,
  m.ana_ma3,
  m.ana_ma12,
  m.total_ana_ma3,
  m.total_ana_ma12,
  a.abc_ana_full_scope,
  e.price_effect_per,
  e.quantity_effect_per,
  e.volume_effect_per,
  CURRENT_TIMESTAMP as last_updated_date

from {{ ref('int_metrics_per') }} p

left join {{ ref('int_metrics_ytd') }} y
  on p.product_id = y.product_id
  and p.date = y.date

left join {{ ref('int_moving_averages') }} m
  on p.product_id = m.product_id
  and p.date = m.date

left join {{ ref('int_abc') }} a
  on p.product_id = a.product_id
  and p.date = a.date

left join {{ ref('int_effects') }} e
  on p.product_id = e.product_id
  and p.date = e.date


{% if is_incremental() %}
where p.date > (select max(date) from {{ this }})
{% endif %}


