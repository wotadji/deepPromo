{{ config(
    materialized='table',
    unique_key='item_id'
) }}

with raw_data as (
    select *
    from {{ ref('stg_sales_data') }}
    {% if target.name == 'dev' %}
    limit {{ var('row_limit_dev', 1000000) }}
    {% endif %}
),

aggregated as (
    select
     md5(
            concat(
                year::text, '|',
                month::text, '|',
                store_id, '|',
                product_id, '|',
                product_category, '|',
                scenario, '|',
                product_department, '|',
                sales_channel, '|',
                commercial_region, '|',
                customer_type, '|',
                customer_segment
            )
        ) as item_id,
        year,
        month,
        country,
        region,
        department,
        city,
        store_id,
        product_id,
        product_description,
        payment_type,
        customer_type,
        promotion_flag,
        product_department,
        product_category,
        scenario,
        sales_channel,
        customer_segment,
        commercial_region,
        data_version,
        data_sources,
        validation_status,
        geographic_zone,
        store_size,
        store_type,
        acquisition_channel,
        purchase_frequency,
        
        
        sum(purchase_price) as purchase_price,
        sum(selling_price) as selling_price,
        sum(quantity) as quantity,
        sum(total_price) as total_price,
        sum((selling_price - purchase_price) * quantity) as margin_price,
        max(last_updated_date) as last_updated_date
    
    from raw_data
    group by
        year, month, country, region, department, city, 
        store_id, product_id, product_description, payment_type, 
        customer_type, promotion_flag, product_department, 
        product_category, scenario, sales_channel, customer_segment,
        commercial_region, data_version, data_sources, validation_status,
        geographic_zone, store_size, store_type, acquisition_channel, 
        purchase_frequency
),

uniqueness_check as (
    select 
        item_id,
        count(*) as record_count
    from aggregated
    group by item_id
)

select 
    a.*,
    case 
        when uc.record_count > 1 then 'DUPLICATE_WARNING' 
        else 'UNIQUE' 
    end as data_quality_flag
    
from aggregated a
left join uniqueness_check uc on a.item_id = uc.item_id

{% if is_incremental() %}
where last_updated_date > (select coalesce(max(last_updated_date), '1900-01-01') from {{ this }})
{% endif %}


order by year desc, month desc, store_id, product_id