#!/bin/sh

# Install project dependencies
npm i -g @nestjs/cli
npm install

# Run the main container command
exec "$@"