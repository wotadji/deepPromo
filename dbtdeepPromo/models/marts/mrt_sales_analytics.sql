{{
    config(
        materialized='table',
        unique_key='product_id',
        post_hook=[
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_main_idx ON {{ this }} (product_id)",
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_date_idx ON {{ this }} (date)",
            "ANALYZE {{ this }}"
        ]
    )
}}

select
  {{ select_granularity_columns(var("granularity"), "g") }},
    m.*
from {{ ref('mrt_sales_metrics') }} m
left join {{ ref('granularity') }} g 
  on m.product_id = g.product_id

{% if is_incremental() %}
where p.date > (select max(date) from {{ this }})
{% endif %}

