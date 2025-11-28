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

with per as (
    select * from {{ ref('int_metrics_per') }}
),

ytd as (
    select
        date,
        year,
        month,
        scenario,
        extract(year from date) as year_key,
        {{ var("granularity") }},
        product_id,
        customer_type,
        customer_segment,
        product_category,
        sum(ana_per) over (
            partition by extract(year from date), product_id
            order by date
        ) as ana_ytd,
        sum(coalesce(ref_per,0)) over (
            partition by extract(year from date), product_id
            order by date
        ) as ref_ytd,
        sum(ana_per) over (
            partition by extract(year from date)
            order by date
        ) as total_ana_ytd,
        sum(coalesce(ref_per,0)) over (
            partition by extract(year from date)
            order by date
        ) as total_ref_ytd
    from per
),

ytd_perf as (
    select
        *,
        case when total_ana_ytd <> 0 then ana_ytd / total_ana_ytd end as perf_ytd,
        case when total_ref_ytd <> 0 then ref_ytd / total_ref_ytd end as perf_ref_ytd,
        (case when total_ana_ytd <> 0 then ana_ytd / total_ana_ytd end
         - case when total_ref_ytd <> 0 then ref_ytd / total_ref_ytd end) as perf_var_ytd,
        case when ref_ytd <> 0 then ana_ytd / ref_ytd end as achievement_rate_ytd 
    from ytd
)

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
    ana_ytd,
    ref_ytd,
    perf_ytd,
    perf_ref_ytd,
    perf_var_ytd,
    achievement_rate_ytd
from ytd_perf
{% if is_incremental() and not should_reset_data() and last_updated_date %}
WHERE last_updated_date > (SELECT MAX(last_updated_date) FROM {{ this }})
{% endif %}
