#!/usr/bin/env node
import meow from 'meow';
import fs from 'fs';
import path from 'path';

const CONFIGURATION_FILE_NAME = '.kheperarc';

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

const homeDir = process.env.HOME;

if (!homeDir) {
  console.log('HOME env variable not available, check configuration');
  process.exit(1);
}

const configurationFilePath = path.resolve(homeDir, '.kheperarc');
try {
  const configurationFile = fs.statSync(configurationFilePath).isFile();
} catch (err) {
  console.log('No .kheperarc file found in home directory');
  process.exit(1);
}
