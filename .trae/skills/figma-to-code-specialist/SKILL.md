---
name: Figma-to-Code-Specialist
description: # Figma Implementation Specialist ## Description Apply this skill when converting Figma designs to React + Tailwind code to ensure  pixel-perfect accuracy, proper icon handling, and design system consistency.
---

## Instructions
1. **Prioritize Fidelity**: Match spacing, typography, and colors exactly as defined 
   in Figma. Never guess values.
2. **Icon Handling**:
   - Do NOT use generic placeholders.
   - Prefer `lucide-react` for standard icons. If the design uses custom SVGs, 
     extract the path and create a functional React component.
   - Use `fill="currentColor"` for SVGs to allow Tailwind `text-{color}` styling.
3. **Layout Logic**:
   - Map Figma "Auto Layout" directly to Tailwind `flex` or `grid`.
   - Use `gap-{value}` instead of margins for child spacing to mimic Figma's gap.
4. **Token Usage**:
   - Map Figma color variables (e.g., `Brand/Primary`) to project constants or 
     Tailwind configuration (e.g., `bg-primary`).
5. **Component Reusability**: 
   - Check existing components in `/src` before creating new ones 
     to maintain consistency.