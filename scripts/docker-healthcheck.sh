#!/bin/bash

# Docker healthcheck script for ZakaMall
# Checks if the application is responding to health checks

curl -f http://localhost:${PORT:-5000}/health || exit 1