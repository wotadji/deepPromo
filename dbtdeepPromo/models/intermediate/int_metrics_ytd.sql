{{
    config(
        materialized='table',
    )
}}

with per as (
    select * from {{ ref('int_metrics_per') }}
),

ytd as (
    select
        date,
        extract(year from date) as year_key,
        {{ var("granularity") }},
        product_id,
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
            partition by extract(year from date), product_category
            order by date
        ) as cat_ana_ytd,
        sum(coalesce(ref_per,0)) over (
            partition by extract(year from date), product_category
            order by date
        ) as cat_ref_ytd,
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
        case when total_ana_ytd <> 0 then cat_ana_ytd / total_ana_ytd end as class_perf_ytd,
        case when total_ref_ytd <> 0 then cat_ref_ytd / total_ref_ytd end as class_perf_ref_ytd,
        (case when total_ana_ytd <> 0 then cat_ana_ytd / total_ana_ytd end
         - case when total_ref_ytd <> 0 then cat_ref_ytd / total_ref_ytd end) as class_perf_var_ytd
    from ytd
)

select
    date,
    {{ var("granularity") }},
    product_id,
    product_category,
    ana_ytd,
    ref_ytd,
    class_perf_ytd,
    class_perf_ref_ytd,
    class_perf_var_ytd
from ytd_perf
