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

with base as (
    select
        date,
        product_id,
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
    product_id,
    abc_ana_full_scope
from classified

