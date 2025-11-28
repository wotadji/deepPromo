{{
    config(
        materialized='incremental',
        unique_key=['year',
            'month', 
            'scenario',
            'product_id'
            ],
        post_hook=[
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_main_idx ON {{ this }} (date, product_id)",
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_date_idx ON {{ this }} (date)",
            "ANALYZE {{ this }}"
        ]
    )
}}

select
  p.date,
  {{ select_granularity_columns(var("granularity"), "p") }},
  p.product_id,
  customer_type,
  customer_segment,
  product_category,

  -- Période
  p.qty_ana_per,
  p.ana_per,
  p.qty_ref_per,
  p.ref_per,

  -- Contributions et performances (période)
  p.contrib_per,
  p.contrib_ref_per,
  p.ana_margin_price,

  -- YTD / YTG
  ana_ytd,
  ref_ytd,
  perf_ytd,
  perf_ref_ytd,
  perf_var_ytd,
  achievement_rate_ytd,

  -- Moyennes mobiles
  m.ana_ma3,
  m.ana_ma12,
  m.total_ana_ma3,
  m.total_ana_ma12,

  -- ABC
  a.abc_ana_full_scope,

  -- Effets
  e.price_effect_per,
  e.quantity_effect_per,
  e.volume_effect_per
from {{ ref('int_metrics_per') }} p
left join {{ ref('int_metrics_ytd') }} y using (date, {{ var("granularity") }}, product_id, product_category, customer_type, customer_segment)
left join {{ ref('int_moving_averages') }} m using (date, {{ var("granularity") }}, product_id, product_category, customer_type, customer_segment)
left join {{ ref('int_abc') }} a using (date, {{ var("granularity") }}, product_id, product_category, customer_type, customer_segment)
left join {{ ref('int_effects') }} e using (date, {{ var("granularity") }}, product_id, product_category, customer_type, customer_segment)


{% if is_incremental() %}
  where p.date > (
    select max(date) from {{ this }}
  )
{% endif %}
limit 100000
