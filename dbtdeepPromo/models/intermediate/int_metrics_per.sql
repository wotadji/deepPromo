{{
    config(
        materialized='incremental',
        unique_key=['year', 'month', 'product_id'],
        post_hook=[
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_main_idx ON {{ this }} (date, year, month, product_id)",
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_date_idx ON {{ this }} (date)",
            "ANALYZE {{ this }}"
        ]
    )
}}
with 
    per_actuals as (
    select
        {{ group_by_granularity(var("granularity"), "actuals") }},
        year,
        month,
        '{{ var("ana_scenario") }}' as scenario,
        customer_type,
        customer_segment,
        product_category,
        make_date(year, month, 1) as date,
        product_id,
        sum(quantity) as qty_ana_per,
        sum(total_price) as ana_per,
        sum(margin_price) as ana_margin_price
    from {{ ref('unit_product') }} as actuals
    where scenario = '{{ var("ana_scenario") }}'
        and year = {{ var("ana_year") }}
    group by 
    {{ group_by_granularity(var("granularity"), "actuals") }},
    year,
    month,
    customer_type,
    customer_segment,
    product_category, 
    date, product_id, product_category
    ),
    per_refs as (
    select
        {{ group_by_granularity(var("granularity"), "refs") }},
        year,
        month,
        '{{ var("ref_scenario") }}' as scenario,
        customer_type,
        customer_segment,
        product_category,
        make_date(year, month, 1) as date,
        product_id,
        sum(quantity) as qty_ref_per,
        sum(total_price) as ref_per,
        sum(margin_price) as ref_margin_price
    from {{ ref('unit_product') }} as refs
    where scenario = '{{ var("ref_scenario") }}'
        and year = {{ var("ref_year") }}
    group by 
       {{ group_by_granularity(var("granularity"), "refs") }},
       year,
       month,
       customer_type,
       customer_segment,
       product_category, 
       date, product_id, product_category
    ),

    joined as (
    select
        a.date,
        {{ select_granularity_columns(var("granularity"), "a") }},
        a.year,
        a.month,
        a.scenario::varchar(100),
        a.customer_type,
        a.customer_segment,
        a.product_category,
        a.product_id,
        a.qty_ana_per,
        a.ana_per,
        r.qty_ref_per,
        r.ref_per,
        a.ana_margin_price,
        r.ref_margin_price,
        sum(a.ana_per) over (partition by a.date) as total_ana_month,
        sum(a.ana_margin_price) over (partition by a.date) as total_ana_margin_price,
        sum(coalesce(r.ref_per,0)) over (partition by a.date) as total_ref_month,
        sum(coalesce(r.ref_margin_price,0)) over (partition by a.date) as total_ref_margin_price
    from per_actuals a
    left join per_refs r
        on a.product_id = r.product_id
        and a.product_category = r.product_category
    ),

with_perf as (
  select
    *,
    case when total_ana_month <> 0 then ana_per / total_ana_month end as contrib_per,
    case when total_ref_month <> 0 then ref_per / total_ref_month end as contrib_ref_per,
    case when total_ana_margin_price <> 0 then ana_margin_price / total_ana_margin_price end as contrib_per_margin,
    case when total_ref_margin_price <> 0 then ref_margin_price / total_ref_margin_price end as contrib_ref_per_margin
  from joined
)

select
  date,
  year,
  month,
  scenario,
  {{ var("granularity") }},
  customer_type,
  customer_segment,
  product_category,
  product_id,
  qty_ana_per,
  ana_per,
  coalesce(qty_ref_per, 0) as qty_ref_per,
  coalesce(ref_per, 0) as ref_per, 
  contrib_per,
  coalesce(contrib_ref_per, 0) as contrib_ref_per,
  ana_margin_price,
  CURRENT_TIMESTAMP as last_updated_date
from with_perf
{% if is_incremental() and not should_reset_data() and last_updated_date %}
WHERE last_updated_date > (SELECT MAX(last_updated_date) FROM {{ this }})
{% endif %}

{% if target.name == 'dev' %}
LIMIT {{ var('row_limit_dev', 100000) }}
{% endif %}