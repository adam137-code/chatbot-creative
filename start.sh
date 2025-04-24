#!/bin/bash

# Install dependencies yang diperlukan
apt-get update && apt-get install -y \
  libgconf-2-4 \
  libnss3 \
  libxss1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libdrm2 \
  xdg-utils \
  fonts-liberation \
  libappindicator3-1 \
  libnspr4 \
  libnss3 \
  libx11-xcb1

# Install npm packages dan jalankan bot
npm install
npm uninstall puppeteer-core
npm install puppeteer
node index.js
