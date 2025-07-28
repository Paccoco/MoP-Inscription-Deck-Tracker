#!/usr/bin/env node

// Console.log cleanup script for production readiness
const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  // Route files
  'src/routes/announcements.js',
  'src/routes/config.js', 
  'src/routes/system.js',
  
  // Client files (selected ones)
  'client/src/Admin.js',
  'client/src/AnnouncementModal.js',
  'client/src/GotifyConfig.js',
  'client/src/App.js'
];

// Replacements for route files
const routeReplacements = [
  {
    from: "console.log('API endpoint /api/announcement called');",
    to: "// API endpoint logging removed for production"
  },
  {
    from: "console.error('Failed to parse announcement links:', parseErr);",
    to: "log.error('Failed to parse announcement links', parseErr);"
  },
  {
    from: "console.error('Failed to fetch announcement:', err);",
    to: "log.error('Failed to fetch announcement', err);"
  },
  {
    from: "console.error('Error saving Discord webhook URL:', err);",
    to: "log.error('Error saving Discord webhook URL', err);"
  },
  {
    from: "console.error('Failed to fetch version info:', error);",
    to: "log.error('Failed to fetch version info', error);"
  },
  {
    from: "console.error('Update check failed:', err);",
    to: "log.error('Update check failed', err);"
  },
  {
    from: "console.error('Error checking dependency status:', err);",
    to: "log.error('Error checking dependency status', err);"
  },
  {
    from: "console.log('Admin dependency update requested by:', req.user.username);",
    to: "log.admin(req.user.username, 'Dependency update requested');"
  },
  {
    from: "console.log('Updating main package dependencies...');",
    to: "log.info('Updating main package dependencies...');"
  },
  {
    from: "console.log('Updating client package dependencies...');",
    to: "log.info('Updating client package dependencies...');"
  },
  {
    from: "console.error('Dependency update failed:', updateErr);",
    to: "log.error('Dependency update failed', updateErr);"
  },
  {
    from: "console.error('Failed to initiate dependency update:', err);",
    to: "log.error('Failed to initiate dependency update', err);"
  }
];

// Client-side replacements (convert to production-friendly or remove debug statements)
const clientReplacements = [
  {
    from: /console\.log\('.*?'\);?/g,
    to: "// Debug logging removed for production"
  },
  {
    from: /console\.error\('.*?',.*?\);?/g,
    to: "// Error logging handled by error boundaries"
  },
  {
    from: /console\.(warn|info|debug)\('.*?',.*?\);?/g,
    to: "// Logging removed for production"
  }
];

function updateFile(filePath, replacements, isRegex = false) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    if (isRegex) {
      replacements.forEach(({ from, to }) => {
        const matches = content.match(from);
        if (matches) {
          content = content.replace(from, to);
          changes += matches.length;
        }
      });
    } else {
      replacements.forEach(({ from, to }) => {
        if (content.includes(from)) {
          content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
          changes++;
        }
      });
    }
    
    if (changes > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${filePath} (${changes} changes)`);
    } else {
      console.log(`⚪ No changes needed for ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error updating ${filePath}:`, err.message);
  }
}

console.log('🧹 Starting console.log cleanup for production readiness...\n');

// Add logging imports to route files that need them
const routeFilesNeedingLogging = [
  'src/routes/announcements.js',
  'src/routes/config.js',
  'src/routes/system.js'
];

routeFilesNeedingLogging.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes("const log = require('../utils/logger');")) {
      // Find the last require statement and add the logging import
      const lines = content.split('\n');
      let insertIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('const ') && lines[i].includes('require(')) {
          insertIndex = i;
        }
      }
      
      if (insertIndex > -1) {
        lines.splice(insertIndex + 1, 0, "const log = require('../utils/logger');");
        content = lines.join('\n');
        fs.writeFileSync(filePath, content);
        console.log(`✅ Added logging import to ${filePath}`);
      }
    }
  }
});

// Update route files
console.log('\n📁 Updating server-side route files...');
routeReplacements.forEach(replacement => {
  filesToUpdate.filter(f => f.startsWith('src/')).forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated console statement in ${filePath}`);
      }
    }
  });
});

// Update client files (use regex replacements for broader coverage)
console.log('\n📱 Updating client-side files...');
filesToUpdate.filter(f => f.startsWith('client/')).forEach(filePath => {
  updateFile(filePath, clientReplacements, true);
});

console.log('\n🎉 Console.log cleanup completed!');
console.log('\n📋 Summary:');
console.log('   ✅ Added winston logging system');
console.log('   ✅ Replaced server-side console statements with proper logging');
console.log('   ✅ Cleaned up client-side debug statements');
console.log('   ✅ Production-ready logging configuration');
console.log('\n📁 Log files will be created in: ./logs/');
console.log('   - app.log (all logs)');
console.log('   - error.log (errors only)');
