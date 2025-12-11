# CyberPy LMS - Implementation Strategy & Roadmap

## 1. Project Status Analysis
**Current State:** 
The application has a robust UI shell with a distinct "Cyber/Hacker" aesthetic. The core layouts (Nav, IDE, Chat) are responsive. The Code Execution Engine (Blockly + Skulpt) is integrated and functioning. Authentication (Supabase) is scaffolded.

**Critical Gaps:**
1.  **State Disconnection:** The "Project Files" menu is visual only; it does not load code into the editor.
2.  **Content Engine:** There is no system to load actual lessons, instructions, or validation steps.
3.  **Intelligence:** The Chatbot is a simulation; it needs real AI integration.
4.  **Persistence:** User code, progress, and settings are not saved to the database.

---

## 2. Phased Implementation Roadmap

### Phase 1: The Virtual File System (VFS)
*Goal: Make the "Project Files" functional.*

1.  **Create `FileSystemContext`**:
    *   Manage a virtual file tree in React State.
    *   Functions: `activeFile`, `openFile(id)`, `saveFile(id, content)`, `createFile`, `deleteFile`.
2.  **Integrate with Supabase**:
    *   Create a `user_files` table in Supabase `(user_id, file_path, content, updated_at)`.
    *   Sync local VFS state with Supabase on load and save.
3.  **Connect UI**:
    *   Update `LeftNav.tsx` to read from `FileSystemContext` instead of hardcoded list.
    *   Update `CenterIDE.tsx` to display the `activeFile.content` in `BlockPyWrapper`.

### Phase 2: The Lesson Engine
*Goal: Transform the tool from a sandbox to an LMS.*

1.  **Define Lesson Schema**:
    *   Structure:
        ```json
        {
          "id": "lesson-101",
          "title": "Variables",
          "instructions": "Create a variable named 'score'...",
          "starterCode": "score = 0",
          "validationCriteria": { "checkVariable": "score", "expectedValue": 10 }
        }
        ```
2.  **Lesson UI Overlay**:
    *   Create a `LessonPanel` component in `CenterIDE` that overlays instructions on the top or side.
    *   Add a "Check Work" button.
3.  **Validation Logic**:
    *   Use Skulpt's execution hook to analyze variables after the code runs to verify lesson success.

### Phase 3: AI "Neural Link" Integration
*Goal: Replace simulated chat with Gemini API.*

1.  **API Integration**:
    *   Use the `@google/genai` SDK.
    *   Create a Supabase Edge Function (or backend proxy) to hold the API Key securely. **Do not expose API_KEY in frontend code.**
2.  **Context Aware Prompts**:
    *   When user asks for help, send:
        *   Current Code in Editor.
        *   Current Error Logs.
        *   Current Lesson Instructions.
3.  **Features**:
    *   **"Fix it"**: Button to auto-correct syntax errors.
    *   **"Explain"**: Highlight code block -> Ask AI to explain.

### Phase 4: Gamification & Polish
*Goal: Engagement.*

1.  **XP System**:
    *   Update `profiles` table: `xp`, `level`, `badges` (JSON).
    *   Award XP upon `LessonRunner` success.
2.  **Audio Feedback**:
    *   Add "sci-fi" UI sounds (hover, click, success, error) using `Howler.js` or native Audio.
3.  **PWA Offline Capabilities**:
    *   Configure `vite-plugin-pwa`.
    *   Cache `skulpt` and `blockly` assets for offline coding.

---

## 3. Technical Recommendations

### Database Schema (Supabase)

```sql
-- Existing: profiles
create table lessons (
  id uuid primary key default uuid_generate_v4(),
  slug text unique,
  title text,
  content jsonb, -- instructions, starter code, validation
  order_index int
);

create table user_progress (
  user_id uuid references auth.users,
  lesson_id uuid references lessons,
  status text check (status in ('started', 'completed')),
  code_snapshot text,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

create table user_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  name text,
  content text,
  is_folder boolean,
  parent_id uuid
);
```

### AI Prompt Engineering Strategy

For the K-12 audience, the System Instruction for Gemini should be:
> "You are a futuristic AI Tutor named 'CyberCore'. Your goal is to teach Python to young cadets. Keep responses concise, encouraging, and use cyber-themed metaphors. Never give the answer directly; provide hints to guide the cadet."

---

## 4. Immediate Next Step
**Execute Phase 1:** Create `FileSystemContext` and bind the `LeftNav` file tree to the `CenterIDE` editor. This bridges the gap between navigation and execution.
