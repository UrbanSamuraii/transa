#!/bin/sh

# Install project dependencies
npm install

# Run the main container command
exec "$@"