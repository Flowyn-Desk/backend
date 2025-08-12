# Use the official Node.js 20 image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
# This step is crucial for caching the node_modules layer
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Generate Prisma client and other necessary artifacts
# This step ensures that the Prisma client is available
RUN npx prisma generate

# Build the TypeScript project
# This compiles your code into the 'dist' directory
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Set the command to run the built application
# The 'npm start' script executes 'node dist/server.js'
CMD [ "npm", "start" ]