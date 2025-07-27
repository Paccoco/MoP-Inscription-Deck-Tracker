## 1. Fix Discord Webhook Integration
- Investigate and resolve issues with Discord webhook notifications (not working as intended).
- Ensure deck completions, sales, requests, and admin announcements are reliably sent to Discord.
- Update documentation and activity log for webhook delivery status.
- ✅ Error handling and activity log updates added to Discord webhook delivery (2025-07-26).

## 2. Admin Announcement Form UI/UX Redesign
- Use a card-style container with padding, subtle shadow, and rounded corners.
- Align form fields vertically with consistent spacing and clear grouping.
- Use larger, bold heading for the form title and consistent font sizes for labels/inputs.
- Add color cues for required fields and action buttons (e.g., primary color for “Push Announcement”).
- Use a UI library (Material UI, Chakra UI, or custom CSS) for polished inputs, buttons, and date pickers.
- Add tooltips or helper text for expiry and links fields.
- Make “Add Link” and “Remove” buttons smaller and visually distinct.
- Ensure mobile-friendliness: stack fields, use touch-friendly controls, responsive grid/layout.
- Show inline validation for required fields and display feedback in a styled alert box.
- Add accessibility features: proper labels, aria attributes, keyboard navigation.
- Show a live preview of the announcement as it will appear to users.
- Test on desktop and mobile for consistency and usability.
