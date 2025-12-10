{% snapshot orders_snapshot %}
  {{ config(
      target_schema='dbtdp_dev_intermediate',
      unique_key='id_items',
      strategy='timestamp',
      updated_at='last_updated_date'
  ) }}
  select *
  from {{ ref('stg_sales_data') }}
{% endsnapshot %}