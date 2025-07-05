#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Inventory Management Deployment Checker\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json') || !fs.existsSync('backend/package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Read package.json files
const frontendPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));

console.log('✅ Project Structure Verified');
console.log(`   Frontend: ${frontendPkg.name} (Next.js)`);
console.log(`   Backend: ${backendPkg.name} (Express.js)\n`);

// Check for required files
const requiredFiles = [
  'railway.json',
  'backend/railway.json',
  'DEPLOYMENT.md'
];

console.log('📁 Checking Deployment Files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - Missing!`);
  }
});

console.log('\n🔧 Environment Variables Needed:');
console.log('Backend (.env):');
console.log('   - MONGODB_URI (from MongoDB Atlas)');
console.log('   - PORT (Railway will set this)');
console.log('   - NODE_ENV=production');
console.log('   - JWT_SECRET (optional, for auth)');

console.log('\nFrontend:');
console.log('   - NEXT_PUBLIC_API_URL (Railway backend URL)');

console.log('\n🚂 Railway Deployment Steps:');
console.log('1. Push your code to GitHub');
console.log('2. Go to https://railway.app and login');
console.log('3. Create new project from GitHub repo');
console.log('4. Deploy backend service from /backend folder');
console.log('5. Deploy frontend service from root folder');
console.log('6. Set environment variables in Railway dashboard');
console.log('7. Update NEXT_PUBLIC_API_URL with backend URL');

console.log('\n📖 For detailed instructions, see DEPLOYMENT.md');
console.log('\n🎉 Ready to deploy! Good luck!'); 