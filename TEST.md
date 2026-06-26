# Testing Your Iceland Road Trip App

## Step 1: Open the app
Visit: http://localhost:5173/iceland-road-trip/

## Step 2: What you SHOULD see:

### Header (dark blue bar at top):
- "Iceland Road Trip 2026" 
- Green badge saying "MOBILE v2.0"
- "9 Days · 2026-07-17"

### On DESKTOP (wide screen):
- LEFT: Day cards (40% width) - scrollable list
- RIGHT: Map (60% width)

### On MOBILE (narrow screen or phone):
- TOP: Map (takes 60% of screen height)
- BOTTOM: Day cards (takes 40% of screen height)

## Step 3: Test mobile view on desktop
1. Press F12 (or Cmd+Option+I on Mac)
2. Click the phone/tablet icon
3. Select "iPhone 12 Pro" or resize to narrow
4. You should see layout switch to mobile (stacked)

## What you SHOULD NOT see:
- ❌ Default Vite template with React logo
- ❌ "Get started" message
- ❌ "Count is 0" button

## If you don't see the Iceland app:
1. Hard refresh: Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Try incognito/private mode
4. Check browser console (F12) for errors
