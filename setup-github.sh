#!/bin/bash

echo "GitHub Setup Script for Vehicle Inventory System"
echo "==============================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    echo "✓ Git initialized"
else
    echo "✓ Git already initialized"
fi

# Add all files
echo "Adding files to git..."
git add .
echo "✓ Files added"

# Create initial commit
echo "Creating initial commit..."
git commit -m "Initial commit - Vehicle Inventory System with GitHub Actions"
echo "✓ Commit created"

echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub (https://github.com/new)"
echo "2. Run the following commands:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "   git push -u origin main"
echo ""
echo "3. GitHub Actions will automatically build your app!"
echo "4. Check the Actions tab in your repository after pushing"
echo ""
echo "For detailed instructions, see GITHUB_ACTIONS_SETUP.md"