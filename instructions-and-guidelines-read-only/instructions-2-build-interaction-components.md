# Build Interaction Components

## Overview
This guide provides step-by-step instructions to create reusable interaction components following the design system established in `guideline-1-style.md`. We'll build essential form and interaction components with proper TypeScript types, accessibility, and responsive design.

## Prerequisites
- Next.js project setup (see `instructions-1-setup.md`)
- Icon library installed (Lucide icons recommended)

## Project Structure Setup

Create a components directory structure in your preferred location (typically `src/components/` or `components/`). Organize interaction components in a dedicated folder for better code organization.

### Component Interfaces and Props

Define TypeScript interfaces for your interaction components. Each component should accept standard props including:

**Common Props:**
- `className` for custom styling
- `disabled` for accessibility and interaction control

**Button Component:**
- `variant` (primary, secondary, ghost)
- `size` (xs, sm, md, lg, xl)
- `onClick` handler
- `children` for button content
- `type` for form submission control

**Input Component:**
- `type` for input type (text, email, password, etc.)
- `placeholder` and `value` for content
- `onChange` callback with new value
- `error` for validation messages
- `label` for accessibility
- `required` for form validation
- `size` for visual scale

**Textarea Component:**
- Similar to Input with additional `rows` and `autoResize` options
- Auto-resize capability for dynamic height adjustment

**Pill Component:**
- `label` for display text
- `selected` state for visual feedback
- `onClick` for interaction
- `variant` for single/multiple selection modes
- `size` for visual scale

**Drawer Component:**
- `isOpen` for controlling visibility state
- `onClose` callback for close actions
- `position` for slide direction (left, right, bottom)
- `shouldOpenWithBackdrop` for optional dark overlay
- `widthClass` for size configuration
- `children` for drawer content

## Component Implementations

### Button Component

Create a Button component with multiple variants and sizes. The button should:

- Support primary, secondary, and ghost visual styles
- Include hover and active states for better user feedback
- Provide multiple size options (xs, sm, md, lg, xl)
- Handle disabled states appropriately
- Support form submission types (button, submit, reset)
- Include proper focus management and accessibility features
- Use forwardRef for advanced use cases

### Input Component

Create an Input component that handles form input with validation and accessibility features:

- Support various input types (text, email, password, number, etc.)
- Include label association for screen readers
- Display validation errors when present
- Show required field indicators
- Handle controlled and uncontrolled usage patterns
- Support different sizes for visual hierarchy
- Provide proper focus and error states styling
- Include disabled states for form control

### Textarea Component

Create a Textarea component with auto-resize functionality:

- Support multi-line text input
- Implement auto-resize that adjusts height based on content
- Include all the same features as Input (labels, errors, validation)
- Allow configurable initial rows
- Prevent manual resizing when auto-resize is enabled
- Handle both controlled and uncontrolled usage
- Provide proper accessibility with labels and error states

### Pill Component

Create a Pill component for selectable options:

- Display text labels in rounded, pill-shaped containers
- Support selected/unselected visual states
- Handle click interactions for selection
- Provide different sizes for various contexts
- Include proper disabled states
- Support both single and multiple selection patterns
- Use appropriate cursor styles for interactive vs static pills

### PillList Component

Create a PillList component to manage collections of selectable pills:

- Render arrays of options as individual Pill components
- Support single or multiple selection modes
- Handle selection state management internally or externally
- Provide onChange callbacks for selection updates
- Allow custom sizing and disabled states
- Arrange pills in flexible, wrapping layouts
- Toggle selections appropriately based on variant (single allows only one, multiple allows many)

### Drawer Component

Create a Drawer component that slides in from any screen edge with backdrop support:

- Support multiple positions (left, right, bottom) for flexible placement
- Include optional backdrop overlay with click-to-close functionality
- Provide keyboard navigation with Escape key support
- Implement proper accessibility with ARIA attributes and focus management
- Use portal rendering to avoid z-index and overflow issues
- Prevent body scrolling when open with backdrop enabled
- Include smooth animations with customizable timing
- Support various width/height configurations based on position
- Provide close button with proper positioning and accessibility

### Component Exports

Create an index file to provide clean imports for all interaction components. Export both the components and their TypeScript interfaces for type safety, including Button, Input, Textarea, Pill, PillList, and Drawer components.

## Usage Examples

Create example components to demonstrate your interaction components in action. Include examples showing:

- Different button variants and sizes
- Form inputs with various configurations
- Textarea with auto-resize functionality
- Pill lists with single and multiple selection modes
- Drawer component with different positions and backdrop options
- Error states and validation feedback
- Disabled states for all components

Use these examples to test component behavior and showcase available features.

## Testing Components

Test your components thoroughly to ensure they work correctly:

- Run TypeScript type checking to catch any interface issues
- Create test pages to verify component behavior
- Test all interaction states (hover, focus, disabled)
- Verify accessibility features work properly
- Test form validation and error states
- Ensure components work across different screen sizes

## Component Capabilities

Your interaction components should provide:

- **Flexible styling** - Adaptable to different design systems and styling approaches
- **Accessibility** - Proper ARIA labels, focus management, and keyboard navigation
- **Type safety** - Full TypeScript support with proper interfaces
- **Form integration** - Work seamlessly with form libraries and validation
- **Responsive design** - Function well across different screen sizes
- **Consistent behavior** - Unified interaction patterns and states
- **Customizable appearance** - Support for custom styling while maintaining usability
- **Advanced interactions** - Support for complex UI patterns like drawers, modals, and overlays

These components form the foundation for user interactions throughout your application, from simple form inputs to complex overlay interfaces.