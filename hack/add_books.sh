#!/bin/bash

# This script adds books to a library system using a REST API.
# It uses two different authentication tokens to add books in two halves.
# The first half of the books will be added using the first token,
# and the second half will be added using the second token.
# Make sure to replace the API_URL with your actual API endpoint.
# Usage: ./add_books.sh
# Ensure you have curl installed to run this script.
# Set the API URL
# Replace with your actual API endpoint

API_URL="http://localhost:3000/api/books"

declare -a titles=(
  "1984"
  "To Kill a Mockingbird"
  "Pride and Prejudice"
  "The Hobbit"
  "The Great Gatsby"
  "Brave New World"
  "Moby Dick"
  "The Catcher in the Rye"
  "Crime and Punishment"
  "Frankenstein"
)

declare -a authors=(
  "George Orwell"
  "Harper Lee"
  "Jane Austen"
  "J.R.R. Tolkien"
  "F. Scott Fitzgerald"
  "Aldous Huxley"
  "Herman Melville"
  "J.D. Salinger"
  "Fyodor Dostoevsky"
  "Mary Shelley"
)

declare -a genres=(
  "Dystopian"
  "Classic"
  "Romance"
  "Fantasy"
  "Fiction"
  "Science Fiction"
  "Adventure"
  "Drama"
  "Philosophical"
  "Horror"
)

# First auth token
FIRST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZDhiYWQ2YS1jZjgxLTQ2NDUtOGQwNi04MGU0ODhmMTM3YjQiLCJpYXQiOjE3NDQ0NzkyOTEsImV4cCI6MTc0NDU2NTY5MX0.dUwGH3dzwUEAkeNDX-vQ0IEjvfN4bdWL9ejt7OJUNls"

# Second auth token
SECOND_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MTRhNTkyYS0xYzg1LTQ2N2ItYWIwZi0xNDc3MzQwODA0YmMiLCJpYXQiOjE3NDQ0ODA0MjUsImV4cCI6MTc0NDU2NjgyNX0.EIPNr43_ztJYfVoGdrPP7qAdOfmuHrFLGklUnOgIQxY"

# Calculate midpoint
MIDPOINT=$((${#titles[@]} / 2))

for i in "${!titles[@]}"; do
  # Choose token based on whether we're in first or second half
  if [ $i -lt $MIDPOINT ]; then
    TOKEN=$FIRST_TOKEN
  else
    TOKEN=$SECOND_TOKEN
  fi

  curl --location "$API_URL" \
    --header 'Content-Type: application/json' \
    --header "Authorization: $TOKEN" \
    --data "{
      \"title\": \"${titles[$i]}\",
      \"author\": \"${authors[$i]}\",
      \"genre\": \"${genres[$i]}\"
    }"

  echo -e "\n📚 Added: ${titles[$i]} with token: $(if [ $i -lt $MIDPOINT ]; then echo "FIRST"; else echo "SECOND"; fi)"
done
