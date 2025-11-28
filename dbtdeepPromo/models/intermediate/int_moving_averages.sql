{{
    config(
        materialized='incremental',
        unique_key=['year',
            'month', 
            'scenario',
            'product_id'
            ],
        post_hook=[
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_main_idx ON {{ this }} (date, year, month, product_id)",
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_date_idx ON {{ this }} (date)",
            "ANALYZE {{ this }}"
        ]
    )
}}

select
  date, 
  year,
  month,
  scenario,
  {{ var("granularity") }},
  product_id,
  customer_type,
  customer_segment,
  product_category,
  -- product_category,
  avg(ana_per) over (partition by product_id order by date rows between 2 preceding and current row) as ana_ma3,
  avg(ana_per) over (partition by product_id order by date rows between 11 preceding and current row) as ana_ma12,
  -- avg(class_perf_per) over (partition by product_category order by date rows between 2 preceding and current row) as class_perf_ma3,
  -- avg(class_perf_per) over (partition by product_category order by date rows between 11 preceding and current row) as class_perf_ma12
  avg(ana_per) over (partition by extract(year from date) order by date rows between 2 preceding and current row) as total_ana_ma3,
  avg(ana_per) over (partition by extract(year from date) order by date rows between 11 preceding and current row) as total_ana_ma12
from {{ ref('int_metrics_per') }}
{% if is_incremental() and not should_reset_data() and last_updated_date %}
WHERE last_updated_date > (SELECT MAX(last_updated_date) FROM {{ this }})
{% endif %}
