# FROM ghcr.io/puppeteer/puppeteer:latest

# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
#     PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# WORKDIR /usr/src/app

# COPY package*.json ./
# RUN npm ci

# COPY . .
# CMD ["node", "app.js"]
# Use an official Node runtime as a parent image
FROM node:14

# Install necessary packages for adding a new repository
RUN apt-get update && apt-get install -y wget gnupg2

# Add Google's package signing key
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -

# Add the Google Chrome repository
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

# Update the package list and install Google Chrome
RUN apt-get update && apt-get install -y google-chrome-stable

# Clean up
RUN rm -rf /var/lib/apt/lists/*

# Set the Chrome executable path environment variable (used by Puppeteer)
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
CMD ["node", "app.js"]