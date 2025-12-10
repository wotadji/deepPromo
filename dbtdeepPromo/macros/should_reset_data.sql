{% macro should_reset_data() %}
    {% if var('reset_data', false) %}
        {{ return(true) }}
    {% else %}
        {{ return(false) }}
    {% endif %}
{% endmacro %}