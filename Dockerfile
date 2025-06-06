# Stage 1: Build the application (install dependencies only)
FROM node:18 as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Stage 2: Run the backend with Node (use Debian base for compatibility)
FROM node:18

WORKDIR /app

# Copy installed dependencies and code from build stage
COPY --from=build /app /app

EXPOSE 3000

CMD ["node", "server.js"]
