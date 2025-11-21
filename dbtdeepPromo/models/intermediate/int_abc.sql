{{
    config(
        materialized='table',
    )
}}

with base as (
    select
        date,
        {{ var("granularity") }},
        product_id,
        product_category,
        ana_per
    from {{ ref('int_metrics_per') }}
),

totals as (
    select
        date,
        sum(ana_per) as total_ana_per
    from base
    group by date
),

ranked as (
    select
        b.*,
        t.total_ana_per,
        b.ana_per / nullif(t.total_ana_per,0) as share
    from base b
    join totals t using(date)
),

with_cum as (
    select
        *,
        sum(share) over (
            partition by date
            order by ana_per desc
            rows between unbounded preceding and current row
        ) as cum_share
    from ranked
),

classified as (
    select
        *,
        case
            when cum_share <= 0.8 then 'A'
            when cum_share <= 0.95 then 'B'
            else 'C'
        end as abc_ana_full_scope
    from with_cum
)

select
    date,
    {{ var("granularity") }},
    product_id,
    product_category,
    share,
    cum_share,
    abc_ana_full_scope
from classified
