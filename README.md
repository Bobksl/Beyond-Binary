# Beyond Binary - Collaborative Learning Platform

A game-like learning platform that rewards teams for cooperative academic interactions.

## Features

- **Team-Based Learning**: Students are automatically assigned to teams of 4-6 members
- **Weekly Missions**: Complete cooperative interactions to unlock rewards
- **Three Interaction Types**:
  - Peer explanations with helpful validations
  - Collaborative problem solving
  - Study sessions with reflections
- **Progress System**: Level up and unlock tools, themes, and features
- **News & Updates**: Campus announcements with bookmarking
- **Anti-Gaming Measures**: Prevents reward farming while encouraging genuine collaboration

## Setup Instructions

### 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Run the SQL script to create all tables, functions, and sample data

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Make sure your Supabase credentials are configured in `src/api/client.js`:

```javascript
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'
```

### 4. Run the Application

```bash
npm run dev
```

## How It Works

### User Flow
1. **Sign Up/Login**: Users authenticate and are automatically assigned to teams
2. **Team Dashboard**: View current mission, team members, and progress
3. **Create Interactions**: Start peer explanations, collaborative editing, or study sessions
4. **Validate Contributions**: Mark explanations as helpful, validate edits, or confirm attendance
5. **Mission Completion**: Teams earn points and unlock features when missions are completed

### Mission Requirements
- Complete at least 2 different interaction types per week
- Involve at least 3 unique team members
- All validations must be completed for interactions to count

### Reward System
- **Level 1**: Shared Whiteboard
- **Level 2**: Peer Tutoring Room
- **Level 3**: Exam Prep Templates
- **Level 4**: Wellbeing Activities
- **Level 5**: Custom Theme
- **Level 6**: Workspace Customization

## Database Schema

The system uses the following main tables:
- `profiles` - Extended user information
- `teams` - Team groupings
- `interactions` - Three types of collaborative activities
- `contributions` - Individual participation records
- `validations` - Helpful marks and validations
- `missions` - Weekly team objectives
- `progress_tracks` - Team progression and unlocks
- `news` - Announcements and updates
- `bookmarks` - User-saved news items

## API Reference

### User Management
- `user.me()` - Get current user
- `user.profile()` - Get extended profile
- `user.updateProfile(updates)` - Update profile

### Teams
- `teams.myTeam()` - Get user's team
- `teams.getProgress(teamId)` - Get team progress

### Interactions
- `interactions.getTeamInteractions(teamId)` - Get team activities
- `interactions.createPeerExplanation(teamId, title, content)` - Create peer explanation
- `interactions.createCollaborativeEdit(teamId, title, content)` - Create collaborative edit
- `interactions.createStudySession(teamId, title, description, time)` - Create study session
- `interactions.addValidation(interactionId, contributionId, type, feedback)` - Validate contribution

### Missions
- `missions.getCurrentMission(teamId)` - Get current weekly mission
- `missions.checkCompletion(missionId)` - Check if mission is complete

### News
- `news.getAll()` - Get all news
- `news.getFeatured()` - Get featured news
- `news.getMyBookmarks()` - Get user's bookmarks
- `news.toggleBookmark(newsId)` - Toggle bookmark status

## Development

### Adding New Interaction Types
1. Update the `interaction_type` check constraint in the database
2. Add new creation function in `src/api/entities.js`
3. Update frontend components to handle the new type

### Modifying Reward Logic
1. Update the `increment_team_progress` function
2. Modify unlock requirements in the database
3. Update frontend display logic

### Weekly Mission Automation
Call `create_weekly_missions()` function weekly to generate new missions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.