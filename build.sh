#!/bin/bash
# Generate config.js from environment variable during Netlify build
echo "const OPENAI_API_KEY = '${OPENAI_API_KEY}';" > config.js
