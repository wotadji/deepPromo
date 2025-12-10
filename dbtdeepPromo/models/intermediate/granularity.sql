{{
    config(
        materialized='table',
        unique_key='product_id',
        post_hook=[
            "CREATE INDEX IF NOT EXISTS {{ this.name }}_main_idx ON {{ this }} (product_id)",
            "ANALYZE {{ this }}"
        ]
    )
}}

with full_gra as (
    select
        product_id,
        {{ var("granularity") }}
    
    from {{ ref('stg_sales_data') }}
    GROUP BY
        product_id,
        {{ var("granularity") }}
)

select * from full_gra