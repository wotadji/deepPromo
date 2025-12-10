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

select
  date,
  product_id,
  avg(ana_per) over (partition by product_id order by date rows between 2 preceding and current row) as ana_ma3,
  avg(ana_per) over (partition by product_id order by date rows between 11 preceding and current row) as ana_ma12,
  -- avg(class_perf_per) over (partition by product_category order by date rows between 2 preceding and current row) as class_perf_ma3,
  -- avg(class_perf_per) over (partition by product_category order by date rows between 11 preceding and current row) as class_perf_ma12
  avg(ana_per) over (partition by extract(year from date) order by date rows between 2 preceding and current row) as total_ana_ma3,
  avg(ana_per) over (partition by extract(year from date) order by date rows between 11 preceding and current row) as total_ana_ma12,
  CURRENT_TIMESTAMP as last_updated_date
from {{ ref('int_metrics_per') }}
