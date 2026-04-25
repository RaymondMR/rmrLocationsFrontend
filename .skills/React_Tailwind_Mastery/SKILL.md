---
name: react-tailwind-mastery
description: Integrated skill for building premium React applications with Tailwind CSS v4, focusing on visual excellence, performance, and modern engineering patterns.
---

# React & Tailwind CSS Mastery

Use this skill when building or refining high-end web applications using React, TypeScript, and Tailwind CSS v4. It combines advanced design principles with efficient technical implementation.

## 1. Visual Excellence & Design Philosophy

The goal is to move beyond "AI-generated" looks to deliberate, professional interfaces.

### Core Design Rules
- **Commit to a Direction**: Choose a style (Minimal, Brutalist, Glassmorphism, Industrial) and execute it consistently.
- **Typography First**: Pick fonts with character. Pair a distinctive display face with a readable body face. Use `var(--sans)`, `var(--heading)`, and `var(--mono)` for consistency.
- **Intentional Backgrounds**: Avoid flat empty backgrounds. Use gradients, meshes, subtle noise, or patterns to create depth.
- **Motion with Purpose**: Use animation to reveal hierarchy and stage information. One smooth transition is better than ten random hover effects.

## 2. Tailwind CSS v4 Technical Patterns

Tailwind v4 is CSS-first. Leverage the new configuration model.

### Configuration & Theme
- **CSS Variables**: Use the established CSS variable system in `index.css` for colors (`--accent`, `--bg`, `--text`) and typography.
- **Responsive Breakpoints (Mobile-First)**:
  - Base: `px-4` (Mobile)
  - `md`: `md:px-8 md:grid-cols-2`
  - `lg`: `lg:max-w-7xl`
- **Spacing Scale**: Stick to multiples of 4 (1rem = 16px) for rhythm: `gap-4`, `p-6`, `space-y-12`.

### Responsive Layout Patterns
```tsx
// Page Container
<div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">

// Responsive Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Section with Vertical Rhythm
<section className="py-16 md:py-24">
```

## 3. React Component Engineering

### Conditional Styling
Always use a utility like `cn()` (clsx + tailwind-merge) for managing conditional classes and preventing class collisions.

```tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<button className={cn("px-4 py-2 transition-all", isActive && "bg-accent text-white")}>
```

### Component Extraction
Extract repeated patterns into small, focused components. Prefer passing props for variations rather than creating giant switch cases.

## 4. Best Practices & Quality Gate

- **Mobile First**: Always design for small screens first, then scale up.
- **No `@apply`**: Keep styles in the JSX for visibility and easier maintenance, unless creating a global base style.
- **Semantic HTML**: Use `<main>`, `<section>`, `<article>`, `<header>`, and `<footer>` appropriately.
- **Accessibility**: Ensure interactive elements have focus states and appropriate ARIA labels.

### Quality Check Before Delivery
1. Does the interface have a clear visual point of view?
2. Is the typography and spacing consistent across the component?
3. Does it handle different screen sizes gracefully?
4. Are the colors driven by the theme variables (`--accent`, etc.)?
5. Is the code clean, using `cn()` for logic and avoiding redundant classes?
