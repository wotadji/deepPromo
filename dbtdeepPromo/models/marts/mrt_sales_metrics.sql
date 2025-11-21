{{
    config(
        materialized='incremental',
        unique_key=['date', var("granularity"), 'product_id', 'product_category']
    )
}}

select
  p.date,
  {{ select_granularity_columns(var("granularity"), "p") }},
  p.product_id,
  p.product_category,

  -- Période
  p.qty_ana_per,
  p.ana_per,
  p.qty_ref_per,
  p.ref_per,

  -- Contributions et performances (période)
  p.contrib_per,
  p.contrib_ref_per,
  p.class_perf_per,
  p.class_perf_ref_per,
  p.class_perf_var_per,

  -- YTD / YTG
  y.ana_ytd,
  y.ref_ytd,
  y.class_perf_ytd,
  y.class_perf_ref_ytd,
  y.class_perf_var_ytd,

  -- Moyennes mobiles
  m.ana_ma3,
  m.ana_ma12,
  m.class_perf_ma3,
  m.class_perf_ma12,

  -- ABC
  a.abc_ana_full_scope,

  -- Effets
  e.price_effect_per,
  e.quantity_effect_per,
  e.volume_effect_per
from {{ ref('int_metrics_per') }} p
left join {{ ref('int_metrics_ytd') }} y using (date, {{ var("granularity") }}, product_id, product_category)
left join {{ ref('int_moving_averages') }} m using (date, {{ var("granularity") }}, product_id, product_category)
left join {{ ref('int_abc') }} a using (date, {{ var("granularity") }}, product_id, product_category)
left join {{ ref('int_effects') }} e using (date, {{ var("granularity") }}, product_id, product_category)

limit 100000

{% if is_incremental() %}
  where p.date > (
    select max(date) from {{ this }}
  )
{% endif %}
