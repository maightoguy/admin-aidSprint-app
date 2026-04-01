# User Details

## Purpose

This feature renders the user profile details view that opens from the Users action menu when the **View profile** option is selected.

## Main Components

- `user-details-page.tsx` renders the full profile page and owns tab, modal, loading, and error state
- `user-details-tabs.tsx` renders the reusable tab switcher
- `update-account-modal.tsx` renders the activate/deactivate account dialog
- `update-account-action-item.tsx` renders each actionable row inside the dialog
- the Request History tab is route-driven from the selected user id and reads per-user request records from `user-details.data.ts`

## Route Usage

- Route: `/users/:userId`
- Example: `/users/emery-torff`

## Props

### `UserDetailsPage`

- `initialUserId?: string` allows rendering the page in tests or embedded flows without relying on the router
- `isLoading?: boolean` shows the loading skeleton for profile content
- `errorMessage?: string | null` renders an inline error state above the content
- `onStatusChange?: (user, status) => Promise<void> | void` handles activate/deactivate account updates

### `UpdateAccountModal`

- `open: boolean` controls dialog visibility
- `busyAction: "Activate Account" | "Deactivate Account" | null` controls action loading feedback
- `errorMessage: string | null` renders inline mutation errors
- `onOpenChange: (open: boolean) => void` handles dialog visibility changes
- `onSelectAction: (action) => void` handles action selection

## Integration

- The Users list passes menu actions into `UsersActionsMenu`
- Selecting **View profile** navigates to `/users/:userId`
- The profile page manages local tab state, update-account dialog state, and request-history rendering for the selected user
