{{
    config(
        materialized='incremental',
        unique_key='id_items'
    )
}}

SELECT
    CAST(id_items AS TEXT) AS id_items,
    CAST(id_items AS INT)  AS id_items_int,
    CAST(year AS INT) AS year,
    CAST(month AS INT) AS month,
    CAST(country AS VARCHAR(100)) AS country,
    CAST(region AS VARCHAR(100)) AS region,
    CAST(department AS VARCHAR(100)) AS department,
    CAST(city AS VARCHAR(100)) AS city,
    CAST(store_id AS VARCHAR(100)) AS store_id,
    CAST(product_id AS VARCHAR(100)) AS product_id,
    CAST(product_description AS TEXT) AS product_description,
    CAST(purchase_price AS FLOAT) AS purchase_price,
    CAST(selling_price AS FLOAT) AS selling_price,
    CAST(quantity AS INT) AS quantity,
    CAST(total_price AS FLOAT) AS total_price,
    CAST(payment_type AS VARCHAR(100)) AS payment_type,
    CAST(customer_type AS VARCHAR(100)) AS customer_type,
    CASE 
        WHEN promotion_flag = '1' THEN TRUE
        ELSE FALSE
    END AS promotion_flag,
    CAST(product_department AS VARCHAR(100)) AS product_department,
    CAST(product_category AS VARCHAR(100)) AS product_category,
    CAST(scenario AS VARCHAR(100)) AS scenario,
    CAST(sales_channel AS VARCHAR(100)) AS sales_channel,
    CAST(customer_segment AS VARCHAR(100)) AS customer_segment,
    CAST(commercial_region AS VARCHAR(100)) AS commercial_region,
    CAST(data_version AS VARCHAR(100)) AS data_version,
    CAST(data_sources AS VARCHAR(100)) AS data_sources,
    CAST(validation_status AS VARCHAR(100)) AS validation_status,
    CAST(geographic_zone AS VARCHAR(100)) AS geographic_zone,
    CAST(store_size AS VARCHAR(100)) AS store_size,
    CAST(store_type AS VARCHAR(100)) AS store_type,
    CAST(acquisition_channel AS VARCHAR(100)) AS acquisition_channel,
    CAST(purchase_frequency AS VARCHAR(100)) AS purchase_frequency,
    CURRENT_TIMESTAMP::timestamp AS last_updated_date
FROM {{ source("raw_deepPromo", "dp_lake_parquet_2") }}

{% if is_incremental() and not should_reset_data() and last_updated_date %}
WHERE last_updated_date > (SELECT MAX(last_updated_date) FROM {{ this }})
{% endif %}

{% if target.name == 'dev' %}
LIMIT {{ var('row_limit_dev', 100000) }}
{% endif %}