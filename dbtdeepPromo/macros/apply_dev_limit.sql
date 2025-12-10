{% macro apply_dev_limit() %}
  {% if target.name == 'dev' %}
    -- Limiter les ressources en dev
    SET LOCAL work_mem = '256MB';
    SET LOCAL statement_timeout = '300s';
  {% endif %}
{% endmacro %}