# Planning Guide

A local-first multi-agent pipeline system that orchestrates specialized AI agents to analyze tasks from initial technical and business perspectives through to executive summaries, requiring minimal user interaction and zero cloud dependencies.

**Experience Qualities**:
1. **Effortless** - Users create a task, click run, and receive comprehensive analysis with no hand-holding required
2. **Transparent** - Every agent's output is visible as markdown files, creating a clear audit trail of the analysis process
3. **Professional** - Outputs are structured, consistent, and ready to share with stakeholders at any level

**Complexity Level**: Light Application (multiple features with basic state)
- The app manages job creation, file system operations, and pipeline orchestration, but the complexity is bounded by a single-purpose workflow with clearly defined steps

## Essential Features

### Job Creation
- **Functionality**: Create a new analysis task with title, description, and reference folders
- **Purpose**: Establishes the context and materials for the multi-agent pipeline
- **Trigger**: User clicks "New Task" button
- **Progression**: Click New Task → Fill title/description → Select reference folders → Submit → Job created with unique ID
- **Success criteria**: Job appears in sidebar, job.json created, reference materials copied to job folder

### Pipeline Execution
- **Functionality**: Run 8 sequential AI agents that analyze the task from different perspectives
- **Purpose**: Generate comprehensive documentation from technical, business, product, and executive viewpoints
- **Trigger**: User clicks "Run Full Pipeline" button
- **Progression**: Click Run → Tech Lead analysis → Business Analyst → Cross Review → Updates → Requirements → Backlog → Executive Summary → Complete
- **Success criteria**: All 6 markdown files generated successfully, status updates to "completed"

### Job Management
- **Functionality**: View list of all jobs with status, select to view details
- **Purpose**: Organize and access multiple analysis tasks
- **Trigger**: App loads or user clicks job in sidebar
- **Progression**: Load app → See job list → Click job → View job details and outputs
- **Success criteria**: Jobs persist between sessions, correct status displayed, can switch between jobs

### Output Viewing
- **Functionality**: Display generated markdown files with tabs for each agent output
- **Purpose**: Make analysis results easy to read and navigate
- **Trigger**: Job selected and pipeline completed
- **Progression**: Select job → Click output tab → View formatted markdown
- **Success criteria**: All outputs readable, proper markdown rendering, tab navigation works smoothly

## Edge Case Handling
- **Empty job list**: Show helpful empty state with "Create your first task" prompt
- **Pipeline failure**: Display error message, preserve partial outputs, allow retry
- **Missing reference files**: Warn user during creation, validate paths exist
- **Long-running operations**: Show progress indicator, prevent duplicate runs
- **Invalid markdown**: Gracefully handle malformed output, show raw text if needed

## Design Direction
The design should evoke a sense of professional tooling—like a sophisticated IDE or analysis dashboard. It should feel serious and purposeful, with clear information hierarchy and a focus on content readability.

## Color Selection
A technical, professional palette with strong contrast for extended reading sessions.

- **Primary Color**: Deep slate blue oklch(0.25 0.05 250) - Communicates technical sophistication and reliability
- **Secondary Colors**: 
  - Warm gray oklch(0.45 0.01 50) for supporting UI elements
  - Cool white oklch(0.98 0.005 250) for primary surfaces
- **Accent Color**: Energetic teal oklch(0.65 0.15 190) - Draws attention to actions and running processes
- **Foreground/Background Pairings**: 
  - Primary surface (Cool White oklch(0.98 0.005 250)): Dark text oklch(0.15 0.01 250) - Ratio 14.2:1 ✓
  - Accent (Teal oklch(0.65 0.15 190)): White text oklch(1 0 0) - Ratio 5.1:1 ✓
  - Sidebar (Light Gray oklch(0.95 0.005 250)): Dark text oklch(0.15 0.01 250) - Ratio 13.1:1 ✓

## Font Selection
Choose typefaces that balance technical precision with readability for long-form documentation review.

- **Typographic Hierarchy**:
  - App Title: Space Grotesk Bold/24px/tight tracking (-0.02em)
  - Job Titles: Space Grotesk Semibold/18px/normal tracking
  - Section Headers: Space Grotesk Medium/16px/normal tracking
  - Body Text: IBM Plex Sans Regular/15px/relaxed leading (1.7)
  - Code/Filenames: JetBrains Mono Regular/14px/normal leading (1.5)
  - Markdown Content: IBM Plex Serif Regular/16px/relaxed leading (1.8) for readability

## Animations
Animations should be subtle and functional—communicating state changes and guiding attention without distraction. Pipeline progress uses a smooth progress bar with percentage. Tab switches use a quick fade transition (150ms). Status badges pulse gently when "running". File list items fade in sequentially when loaded.

## Component Selection
- **Components**: 
  - Sidebar for job navigation with collapsible sections
  - Card for job details header with metadata
  - Tabs for switching between agent outputs
  - Button for primary actions (Run Pipeline, New Task)
  - Dialog for new task creation form
  - Badge for status indicators (new/running/completed/failed)
  - ScrollArea for job lists and markdown content
  - Separator to divide UI sections
  - Input and Textarea for form fields
- **Customizations**: 
  - Custom markdown renderer for agent outputs with syntax highlighting
  - Custom progress indicator showing which agent is currently running
  - File tree component for reference folder display
- **States**: 
  - Buttons show loading spinner when pipeline running, disabled state when no job selected
  - Tabs highlight active output, show completion checkmarks
  - Job list items show hover state, selected state with accent border
  - Status badges use color coding: gray (new), teal (running), green (completed), red (failed)
- **Icon Selection**: 
  - Phosphor icons: Plus for new task, Play for run pipeline, File for outputs, FolderOpen for references, Check for completed, X for failed, Spinner for running
- **Spacing**: 
  - Container padding: p-6
  - Card spacing: p-4
  - List item gaps: gap-2
  - Section margins: mb-6
  - Form field spacing: space-y-4
- **Mobile**: 
  - Sidebar collapses to hamburger menu below 768px
  - Tabs switch to dropdown selector on mobile
  - Two-column layout becomes single column stacked
  - Markdown content gets full width with reduced side padding (p-4)
