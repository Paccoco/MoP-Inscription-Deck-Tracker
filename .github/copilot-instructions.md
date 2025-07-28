# Copilot Instructions for Mist of Pandaria Card Tracker

## 🎯 Mission: Autonomous Development Agent
**Goal**: Complete all tasks independently with minimal user involvement. Only escalate major architectural decisions or breaking changes.

## 🚨 Critical Terminal Rules
- **NEVER use streaming commands without limits**: Always use `--lines X`, `--no-stream`, `head -n X`, `tail -n X`
- **Examples**: `pm2 logs app --lines 20 --nostream`, `npm test 2>&1 | head -50`, `git log --oneline -10`
- **If terminal gets stuck**: Immediately use tools to kill/restart the process

## 🏗️ Project Architecture
- **Stack**: React frontend + Express.js backend + SQLite database
- **Main Files**: 
  - `server-auth.js` (1669 lines - NEEDS SPLITTING)
  - `client/src/App.js` (716 lines - NEEDS COMPONENT SPLITTING)
  - `client/src/Admin.js` (541 lines - NEEDS MODULARIZATION)
- **Database**: SQLite with WAL mode, all tables documented in `init-database.sh`
- **Auth**: JWT tokens, admin/user roles, user approval workflow
- **Notifications**: In-app + Discord webhooks + per-user Gotify

## ⚡ Autonomous Work Rules

### 🔧 Auto-Fix Without Asking
- Obvious bugs (null checks, typos, missing imports)
- Console.log cleanup for production
- ESLint errors and warnings
- Missing error handling
- Input validation additions
- Performance optimizations (React.memo, useMemo, useCallback)
- File splitting when over 500 lines

### 🤔 Ask Before Major Changes
- Database schema modifications
- Breaking API changes
- Security configuration changes
- Deployment script modifications
- Major architectural refactoring

### 📋 Task Management Protocol
1. **Read `tasks.md`** - Prioritize High > Medium > Low
2. **Complete entire task** including sub-tasks
3. **Test thoroughly** - verify functionality works
4. **Update documentation** IMMEDIATELY after each change:
   - **CHANGELOG.md**: Document EVERY change with why/how/where details
   - **README.md**: Only for major features, API changes, setup modifications
5. **Mark complete** with ✅ only after verification
6. **Auto-discover issues** and add to tasks.md during work

**CRITICAL**: Never delay CHANGELOG.md updates - document each change as it happens, not at the end!

## 🧪 Testing & Validation Requirements
- **Always run existing tests**: `npm test 2>&1 | head -50`
- **Create tests for new features**: Minimum 3 test cases (happy path, edge case, error case)
- **Verify in browser**: Test UI changes manually
- **Check for errors**: Use `get_errors` tool on modified files
- **Database integrity**: Verify schema and data consistency

## 🗂️ File Organization Standards
- **500 line limit**: Split files immediately when exceeded
- **Module structure**: Group by feature, not file type
- **Clear imports**: Use relative imports, document dependencies
- **Error boundaries**: Wrap React components properly
- **Utility functions**: Extract common code to `/utils`

## 📚 Documentation Automation
- **README.md**: Only update for major features, API changes, setup modifications
- **CHANGELOG.md**: **CRITICAL - Document ALL changes immediately as they are made**
  - **What**: Every file modification, feature addition, bug fix, refactoring, etc.
  - **Why**: Include rationale - what problem was solved, what benefit was gained
  - **How**: Technical implementation details - what methods/patterns were used
  - **Where**: Specific files affected with relative paths from project root
  - **Format**: Use [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) with Added/Changed/Fixed/Removed categories
  - **Versioning**: Follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) - current: 2.0.0-alpha
  - **Timing**: Update IMMEDIATELY after each change, not at end of session
  - **Exclusions**: DO NOT document changes to `.github/copilot-instructions.md` itself in the changelog
  - **Examples**: 
    - "Split `server-auth.js` into modular components for better maintainability"
    - "Added input validation to `/api/cards` endpoint to prevent SQL injection"
    - "Fixed React useEffect dependency warnings in `client/src/App.js` for performance"
- **PRODUCTION-DEPLOYMENT.md**: **CRITICAL - Update for any deployment-affecting changes**
  - **When**: Database schema changes, new environment variables, Docker config changes, security updates
  - **What**: New deployment steps, configuration changes, troubleshooting updates, feature-specific deployment notes
  - **Why**: Ensure production deployments remain accurate and functional with application changes
  - **Examples**: New PostgreSQL migrations, Docker environment changes, health check endpoints, security configurations
- **HOWTOUPDATE.md**: Update for deployment/update script changes
- **Code comments**: Add for complex logic with `// Reason:` explanations

## 🔒 Security & Performance Standards
- **Input validation**: All `req.body`, `req.params`, `req.query` must be validated
- **SQL safety**: Use parameterized queries, avoid `SELECT *`
- **Rate limiting**: Add to auth endpoints
- **CORS**: Verify production configuration
- **Environment variables**: Use for all secrets
- **Error handling**: Consistent try-catch patterns
- **Database indexes**: Add for frequently queried columns

## 🚀 Production Safety Rules
- **Never break production**: Test changes thoroughly
- **Backup before schema changes**: Automatic backup creation
- **Version tracking**: Update package.json, CHANGELOG.md consistently using [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- **Rollback capability**: Ensure all changes are reversible
- **Monitor after deployment**: Check logs and functionality

## 📋 Semantic Versioning Standards
- **Follow semver.org/spec/v2.0.0.html** for all version numbering
- **Current Version**: Starting with 2.0.0-alpha for Version 2.0 development
- **Version Format**: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
- **Version Increments**:
  - **MAJOR**: Breaking changes, incompatible API changes
  - **MINOR**: New functionality, backward compatible
  - **PATCH**: Bug fixes, backward compatible
  - **PRERELEASE**: alpha, beta, rc.1, rc.2, etc.
- **Examples**: 2.0.0-alpha, 2.0.0-alpha.1, 2.0.0-beta, 2.0.0-rc.1, 2.0.0
- **Update package.json version** whenever creating releases or significant milestones

## 🔄 Common Task Patterns
1. **Bug Fixes**: Identify root cause → Fix → Test → Document → Verify
2. **New Features**: Plan → Implement → Test → Document → Integration test
3. **Code Cleanup**: Analyze → Refactor → Maintain functionality → Test → Optimize
4. **Performance**: Profile → Optimize → Benchmark → Verify improvement
5. **Security**: Audit → Patch → Test → Document security measures

## 📊 Progress Reporting Format
**Concise summaries with key points**:
- ✅ **Completed**: Brief description of what was accomplished
- 🔧 **Fixed**: Issues resolved and root causes
- 📝 **Added**: New features or capabilities
- ⚠️ **Discovered**: New issues found and added to tasks
- 🧪 **Tested**: Verification steps completed
- 📚 **Documented**: Files updated with changes

## 🎯 Success Criteria
- **Task completion**: All requirements met and verified
- **Code quality**: Follows standards, properly tested
- **Documentation**: Updated and accurate
- **Functionality**: Works as expected in all environments
- **No regressions**: Existing features still work
- **Ready for production**: Changes are deployment-ready

---

**Remember**: Be autonomous, thorough, and safety-conscious. Complete tasks independently while maintaining high quality standards.
