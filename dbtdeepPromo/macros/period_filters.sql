{% macro get_period_filter(period_type, period_value, year, date_column) %}
  {% if period_type == 'month' and period_value != '' %}
    AND EXTRACT(MONTH FROM {{ date_column }}) = {{ period_value }}
    AND EXTRACT(YEAR FROM {{ date_column }}) = {{ year }}
  
  {% elif period_type == 'quarter' and period_value != '' %}
    AND EXTRACT(QUARTER FROM {{ date_column }}) = {{ period_value }}
    AND EXTRACT(YEAR FROM {{ date_column }}) = {{ year }}
  
  {% elif period_type == 'semester' and period_value != '' %}
    AND CASE 
          WHEN EXTRACT(MONTH FROM {{ date_column }}) <= 6 THEN 1 
          ELSE 2 
        END = {{ period_value }}
    AND EXTRACT(YEAR FROM {{ date_column }}) = {{ year }}
  
  {% else %}
    AND EXTRACT(YEAR FROM {{ date_column }}) = {{ year }}
  {% endif %}
{% endmacro %}

{% macro get_period_date(period_type, year, period_value) %}
  {% if period_type == 'month' and period_value != '' %}
    MAKE_DATE({{ year }}, {{ period_value }}, 1)
  
  {% elif period_type == 'quarter' and period_value != '' %}
    MAKE_DATE({{ year }}, ({{ period_value }} - 1) * 3 + 1, 1)
  
  {% elif period_type == 'semester' and period_value != '' %}
    MAKE_DATE({{ year }}, ({{ period_value }} - 1) * 6 + 1, 1)
  
  {% else %}
    NULL
  {% endif %}
{% endmacro %}

{% macro get_period_label(period_type, period_value, year) %}
  {% if period_type == 'month' and period_value != '' %}
    '{{ year }}-M' || {{ period_value }}
  
  {% elif period_type == 'quarter' and period_value != '' %}
    '{{ year }}-T' || {{ period_value }}
  
  {% elif period_type == 'semester' and period_value != '' %}
    '{{ year }}-S' || {{ period_value }}
  
  {% else %}
    '{{ year }}-Annual'
  {% endif %}
{% endmacro %}