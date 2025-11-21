{{
    config(
        materialized='table',
    )
}}

select
  date,
  {{ var("granularity") }},
  product_id,
  product_category,
  avg(ana_per) over (partition by product_id order by date rows between 2 preceding and current row) as ana_ma3,
  avg(ana_per) over (partition by product_id order by date rows between 11 preceding and current row) as ana_ma12,
  avg(class_perf_per) over (partition by product_category order by date rows between 2 preceding and current row) as class_perf_ma3,
  avg(class_perf_per) over (partition by product_category order by date rows between 11 preceding and current row) as class_perf_ma12
from {{ ref('int_metrics_per') }}
