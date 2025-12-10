#!/bin/bash

# Activer Node.js pour le frontend
cd deepPromo-dashboard
nvm use
npm run dev &

# Activer Python/dbt pour le backend
cd ../backend
source ../venv/bin/activate
node server.js
