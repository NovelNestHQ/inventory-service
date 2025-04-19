# Use Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application
COPY . .

# Install TypeScript and nodemon globally for development
RUN yarn global add ts-node nodemon


# Run Prisma migrations and generate client
# Ensure the database is up and running before running migrations
RUN npx prisma migrate
RUN npx prisma generate

# Expose port for the API
EXPOSE 3000

# Start the app in dev mode with nodemon
CMD ["yarn", "dev:hot"]

