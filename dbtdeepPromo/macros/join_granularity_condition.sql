{% macro join_granularity_condition(granularity, alias1, alias2) %}
    {% set columns = granularity.split(",") | map('trim') %}
    {%- set join_conditions = [] -%}
    {%- for column in columns -%}
        {%- set _ = join_conditions.append(alias1 ~ "." ~ column ~ " = " ~ alias2 ~ "." ~ column) -%}
    {%- endfor -%}
    {{ join_conditions | join(' and ') }}
{% endmacro %}