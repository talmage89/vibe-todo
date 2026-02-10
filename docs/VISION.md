# Todo App Vision Document

## Overview

A modern, minimal todo application focused on personal productivity with selective sharing capabilities. Built with a clean, keyboard-friendly interface inspired by contemporary productivity tools.

## Core Philosophy

- **Minimal but powerful**: Clean interface that doesn't overwhelm, with depth available when needed
- **Hierarchy without complexity**: Full organizational structure (projects, sub-tasks) presented simply
- **Personal-first, share when ready**: Optimized for individual use with frictionless sharing options

---

## Authentication

### OAuth Providers

- **Google OAuth 2.0**: Primary authentication method
- **GitHub OAuth**: Alternative for developer-focused users

### User Experience

- One-click sign-in flow
- Automatic account linking if same email exists across providers
- Session persistence with secure token refresh
- Clean sign-out that clears all local state

---

## Task Model

### Core Attributes

| Field       | Type      | Description                      |
| ----------- | --------- | -------------------------------- |
| Title       | String    | Required, max 500 characters     |
| Description | Rich Text | Optional, supports markdown      |
| Due Date    | DateTime  | Optional, date and optional time |
| Priority    | Enum      | None, Low, Medium, High, Urgent  |
| Status      | Enum      | Todo, In Progress, Done          |
| Tags        | Array     | User-defined, colored labels     |
| Attachments | Files     | Images, documents, links         |

### Hierarchy

```
Workspace (implicit, per-user)
└── Project
    └── Task
        └── Subtask (single level of nesting)
```

- **Projects**: Top-level containers for related work
- **Tasks**: Primary work items
- **Subtasks**: Checklist-style items nested under a task (one level deep)

### Tags

- User-created with custom colors
- Searchable and filterable
- Can span across projects
- No limit on tags per task

---

## Views

### List View (Default)

- Grouped by project or flat across all projects
- Sortable by: due date, priority, created date, alphabetical
- Filterable by: project, tags, priority, status, due date range
- Inline editing for quick updates
- Drag-and-drop reordering within groups

### Kanban Board

- Columns represent status: Todo → In Progress → Done
- Cards show: title, due date indicator, priority badge, tag chips
- Drag-and-drop between columns updates status
- Column-level filtering
- Optional: custom columns per project

### View Persistence

- Last-used view remembered per project
- Global default view preference in settings

---

## Search

### Full-Text Search

- Searches across: titles, descriptions, tags, project names
- Instant results as you type
- Highlights matching terms
- Recent searches remembered

### Quick Filters

- `is:overdue` - Past due date
- `is:today` - Due today
- `is:upcoming` - Due within 7 days
- `is:untagged` - No tags assigned
- `priority:high` - High priority items
- `project:name` - Within specific project

### Keyboard Shortcut

- `Cmd/Ctrl + K` opens search/command palette

---

## Task Templates

### Purpose

Reusable task structures for recurring workflows.

### Template Contents

- Title (with placeholder variables)
- Default description
- Default tags
- Default priority
- Subtask checklist

### Example Templates

- **Weekly Review**: Checklist of review items
- **Bug Report**: Description template with reproduction steps
- **Feature Request**: Structured requirements format

### Management

- Create from existing task ("Save as Template")
- Create from scratch in Settings → Templates
- Apply when creating new task
- Templates are user-specific (not shared)

---

## Sharing

### Share Links (Read-Only)

- Generate public link for any project or individual task
- Link viewers see current state, cannot edit
- Optional: password protection
- Optional: expiration date
- Revocable at any time

### Collaborator Invites (Edit Access)

- Invite by email address
- Invitee must have account (prompted to sign up if not)
- Permission levels:
  - **Viewer**: Read-only access
  - **Editor**: Can create, edit, complete tasks
  - **Admin**: Editor + can invite others, delete project
- Activity log shows who changed what

### Sharing Scope

- Share entire project (includes all tasks/subtasks)
- Share individual task (includes subtasks)

---

## Keyboard Shortcuts

### Global

| Shortcut               | Action                        |
| ---------------------- | ----------------------------- |
| `Cmd/Ctrl + K`         | Open command palette / search |
| `Cmd/Ctrl + N`         | New task                      |
| `Cmd/Ctrl + Shift + N` | New project                   |
| `Esc`                  | Close modal / deselect        |

### Task Navigation

| Shortcut      | Action                      |
| ------------- | --------------------------- |
| `↑ / ↓`       | Navigate task list          |
| `Enter`       | Open selected task          |
| `Space`       | Toggle task complete        |
| `Tab`         | Indent (convert to subtask) |
| `Shift + Tab` | Outdent                     |

### Task Editing

| Shortcut             | Action                          |
| -------------------- | ------------------------------- |
| `E`                  | Edit selected task              |
| `D`                  | Set due date                    |
| `P`                  | Set priority                    |
| `T`                  | Add tags                        |
| `Delete / Backspace` | Delete task (with confirmation) |

---

## Design System

### Philosophy

- **Neutral palette**: Black, white, grays with subtle accent colors
- **Generous whitespace**: Let content breathe
- **Typography-driven**: Clear hierarchy through font weight and size
- **Subtle interactions**: Hover states, transitions that feel natural

### Color Palette

#### Light Mode

| Role           | Color     |
| -------------- | --------- |
| Background     | `#FFFFFF` |
| Surface        | `#F9FAFB` |
| Border         | `#E5E7EB` |
| Text Primary   | `#111827` |
| Text Secondary | `#6B7280` |
| Accent         | `#3B82F6` |

#### Dark Mode

| Role           | Color     |
| -------------- | --------- |
| Background     | `#0F0F0F` |
| Surface        | `#1A1A1A` |
| Border         | `#2D2D2D` |
| Text Primary   | `#F9FAFB` |
| Text Secondary | `#9CA3AF` |
| Accent         | `#60A5FA` |

### Priority Colors

| Priority | Light     | Dark      |
| -------- | --------- | --------- |
| Urgent   | `#DC2626` | `#EF4444` |
| High     | `#F97316` | `#FB923C` |
| Medium   | `#EAB308` | `#FACC15` |
| Low      | `#22C55E` | `#4ADE80` |

### Theme Switching

- Toggle in header or settings
- Respects `prefers-color-scheme` by default
- User override persists in preferences

### Typography

- **Font Family**: Inter (system font stack fallback)
- **Scale**: 12, 14, 16, 18, 24, 32px
- **Weights**: 400 (regular), 500 (medium), 600 (semibold)

### Components

- **Buttons**: Minimal, clear click targets
- **Inputs**: Borderless until focused
- **Modals**: Centered, backdrop blur
- **Toasts**: Bottom-right, auto-dismiss

---

## User Settings

### Profile

- Display name
- Avatar (from OAuth provider or upload)
- Email (from OAuth, read-only)

### Preferences

- Default view (list/kanban)
- Default project for quick capture
- Theme (light/dark/system)
- Keyboard shortcuts enabled/disabled

### Data

- Export all data (JSON)
- Delete account

---

## Technical Requirements

### Stack (Pre-selected)

- **Runtime**: Bun
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM
- **Backend**: Hono (lightweight, fast)

### Performance Targets

- Initial load: < 2s on 3G
- Task operations: < 100ms perceived
- Search results: < 200ms

### Accessibility

- WCAG 2.1 AA compliance
- Full keyboard navigation
- Screen reader support
- Reduced motion support

---

## Out of Scope (v1)

The following are explicitly not included in the initial release:

- Notifications (email, push, in-app)
- Recurring tasks
- Time tracking / estimates
- Calendar integration
- Mobile native apps (responsive web only)
- Offline support
- API for third-party integrations
- Team workspaces (sharing is per-project, not org-level)
- Custom fields
- Comments on tasks
- Task activity history (beyond sharing activity)

---

## Success Metrics

### User Experience

- Task creation to completion in < 5 clicks
- New user creates first task within 30 seconds
- Search finds relevant results in top 3

### Technical

- Lighthouse performance score > 90
- Zero critical accessibility violations
- < 100KB JavaScript bundle (gzipped, initial load)

---

## Revision History

| Version | Date       | Author | Changes                 |
| ------- | ---------- | ------ | ----------------------- |
| 1.0     | 2026-01-28 | —      | Initial vision document |
