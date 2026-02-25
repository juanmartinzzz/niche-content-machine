# Future Features

This document outlines planned enhancements and new capabilities for the Niche Content Machine application.

## Runbook Management

### Output Language Configuration
- **Feature**: Ability to set the desired output language for runbook steps
- **Default**: English
- **Details**: Users should be able to specify the language (e.g., Spanish, French, German, etc.) for individual runbook steps or entire runbooks
- **Use Case**: Generate content in multiple languages for international audiences
- **Implementation Notes**:
  - Add language selector to runbook creation/editing interface
  - Store language preference per runbook step
  - Pass language parameter to AI generation APIs
  - Support both individual step language settings and global runbook language defaults

### Easy Runbook Duplication
- **Feature**: One-click duplication of existing runbooks
- **Details**: Users should be able to quickly create copies of runbooks for modification and reuse
- **Use Case**: Create variations of successful runbooks, template-based workflows
- **Implementation Notes**:
  - Add "Duplicate" button to runbook list and detail views
  - Generate new runbook with copied steps and configuration
  - Auto-increment naming (e.g., "My Runbook (Copy)", "My Runbook (Copy 2)")
  - Option to modify duplicated runbook immediately after creation