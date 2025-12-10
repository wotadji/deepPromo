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

with plp as (
    select
        year,
        month,
        store_id,
        product_id,
        product_category,
        scenario,
        product_department,
        sales_channel,
        commercial_region,
        customer_type,
        customer_segment,
        sum(purchase_price) as purchase_price,
        sum(selling_price) as selling_price,
        sum(quantity) as quantity,
        sum(total_price) as total_price,
        sum((selling_price - purchase_price) * quantity) as margin_price,
        max(last_updated_date) as last_updated_date
    
    from {{ ref('stg_sales_data') }}
    GROUP BY 
        year,
        month,
        store_id,
        product_id,
        product_category,
        scenario,
        product_department,
        sales_channel,
        commercial_region,
        customer_type,
        customer_segment
)

select * from plp