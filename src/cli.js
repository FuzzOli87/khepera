#!/usr/bin/env node
import meow from 'meow';

const cli = meow(`
  Usage 
    $ baseproj
  Options
    -p, --path        Path to configuration file to create new project 
  `, {
    string: ['path'],
    alias: {
      p: 'path'
    }
  }
);

console.log('Invalid .setupizerrc configuration file');
process.exit(1);
