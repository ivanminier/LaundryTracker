# Use Playwright’s official image (includes all browser dependencies)
FROM mcr.microsoft.com/playwright:v1.30.0-focal

# Set working directory
WORKDIR /app

# Copy package manifest and install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the code
COPY . .

# Expose the port Render will use
ENV PORT 3000
EXPOSE 3000

# Launch the app
CMD ["node", "index.js"]
