# Use Playwright’s official image (includes all browser deps)
FROM mcr.microsoft.com/playwright:v1.30.0-focal

# Set working directory
WORKDIR /app

# Copy only package.json and install
COPY package.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# Expose port and start
ENV PORT 3000
EXPOSE 3000
CMD ["node", "index.js"]
