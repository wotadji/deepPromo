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

with 
    per_actuals as (
    select
        make_date(year, month, 1) as date,
        product_id,
        sum(quantity) as qty_ana_per,
        sum(total_price) as ana_per,
        sum(margin_price) as ana_margin_price
    from {{ ref('unit_product') }}
    where scenario = '{{ var("ana_scenario") }}'
        and year = {{ var("ana_year") }}
    group by
    date,
    product_id
    ),
    per_refs as (
    select
        make_date(year, month, 1) as date,
        product_id,
        sum(quantity) as qty_ref_per,
        sum(total_price) as ref_per,
        sum(margin_price) as ref_margin_price
    from {{ ref('unit_product') }}
    where scenario = '{{ var("ref_scenario") }}'
        and year = {{ var("ref_year") }}
    group by
    date,
    product_id
    ),

    joined as (
    select
        a.date,
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
  product_id,
  sum(qty_ana_per) as qty_ana_per,
  sum(ana_per) as ana_per,
  sum(coalesce(qty_ref_per, 0)) as qty_ref_per,
  sum(coalesce(ref_per, 0)) as ref_per, 
  sum(contrib_per) as contrib_per,
  sum(coalesce(contrib_ref_per, 0)) as contrib_ref_per,
  sum(ana_margin_price) as ana_margin_price
from with_perf
GROUP BY 
  date,
  product_id
order by date, product_id
{% if target.name == 'dev' %}
LIMIT {{ var('row_limit_dev', 100000) }}
{% endif %}