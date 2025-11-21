/*
{#
{% set debug_granularity = var("granularity") %}
{% set debug_group_by_actuals = group_by_granularity(var("granularity"), "a") %}
{% set debug_group_by_refs = group_by_granularity(var("granularity"), "r") %}

{{ log("Granularity variable: " ~ debug_granularity, info=true) }}
{{ log("Group by actuals generated: " ~ debug_group_by_actuals, info=true) }}
{{ log("Group by refs generated: " ~ debug_group_by_refs, info=true) }}
#}
*/
{{
    config(
        materialized='table',
    ) 
}}

with 
    per_actuals as (
    select
        {{ group_by_granularity(var("granularity"), "actuals") }},
        make_date(year, month, 1) as date,
        product_id,
        product_category,
        sum(quantity) as qty_ana_per,
        sum(total_price) as ana_per
    from {{ ref('stg_sales_data') }} as actuals
    where scenario = '{{ var("ana_scenario") }}'
        and year = {{ var("ana_year") }}
    group by {{ group_by_granularity(var("granularity"), "actuals") }}, date, product_id, product_category
    ),
    per_refs as (
    select
        {{ group_by_granularity(var("granularity"), "refs") }},
        make_date(year, month, 1) as date,
        product_id,
        product_category,
        sum(quantity) as qty_ref_per,
        sum(total_price) as ref_per
    from {{ ref('stg_sales_data') }} as refs
    where scenario = '{{ var("ref_scenario") }}'
        and year = {{ var("ref_year") }}
    group by 
       {{ group_by_granularity(var("granularity"), "refs") }}, 
        date, product_id, product_category
    ),

    joined as (
    select
        a.date,
        {{ select_granularity_columns(var("granularity"), "a") }},
        a.product_id,
        a.product_category,
        a.qty_ana_per,
        a.ana_per,
        r.qty_ref_per,
        r.ref_per,
        sum(a.ana_per) over (partition by a.date) as total_ana_month,
        sum(coalesce(r.ref_per,0)) over (partition by a.date) as total_ref_month,
        sum(a.ana_per) over (partition by a.date, a.product_category) as cat_ana_month,
        sum(coalesce(r.ref_per,0)) over (partition by a.date, a.product_category) as cat_ref_month
    from per_actuals a
    left join per_refs r
        -- on a.date = r.date
        on a.product_id = r.product_id
        and a.product_category = r.product_category
    ),

with_perf as (
  select
    *,
    case when total_ana_month <> 0 then ana_per / total_ana_month end as contrib_per,
    case when total_ref_month <> 0 then ref_per / total_ref_month end as contrib_ref_per,
    case when total_ana_month <> 0 then cat_ana_month / total_ana_month end as class_perf_per,
    case when total_ref_month <> 0 then cat_ref_month / total_ref_month end as class_perf_ref_per,
    (case when total_ana_month <> 0 then cat_ana_month / total_ana_month end
     - case when total_ref_month <> 0 then cat_ref_month / total_ref_month end) as class_perf_var_per
  from joined
)

select
  date,
  {{ var("granularity") }},
  product_id,
  product_category,
  qty_ana_per,
  ana_per,
  qty_ref_per,
  ref_per,
  contrib_per,
  contrib_ref_per,
  class_perf_per,
  class_perf_ref_per,
  class_perf_var_per
from with_perf