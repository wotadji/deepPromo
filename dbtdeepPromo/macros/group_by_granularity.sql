{% macro group_by_granularity(granularity, table_alias=none) %}
    {% set columns = granularity.split(",") | map('trim') %}
    {% if table_alias %}
        {%- set columns_with_alias = [] -%}
        {%- for column in columns -%}
            {%- set _ = columns_with_alias.append(table_alias ~ "." ~ column) -%}
        {%- endfor -%}
        {{ columns_with_alias | join(', ') }}
    {% else %}
        {{ columns | join(', ') }}
    {% endif %}
{% endmacro %}