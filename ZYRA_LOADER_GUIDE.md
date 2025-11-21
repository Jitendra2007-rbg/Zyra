# ZyraLoader Integration Guide

## Overview
The ZyraLoader has been successfully integrated into your React project. It will display **only once** when a user first visits your website in a browser session, then never again until they close and reopen the browser.

---

## Files Created

### 1. `src/components/ZyraLoader.tsx`
The animated loader component with customizable colors.

### 2. `src/components/AppWithLoader.tsx`
Wrapper component that handles session-based display logic.

### 3. `src/App.tsx` (Modified)
Your main App file now wraps everything with the loader.

---

## How It Works

1. **First Visit**: When a user opens your website, the loader displays for the configured duration
2. **Session Storage**: After the loader finishes, a flag is saved in `sessionStorage`
3. **Subsequent Navigation**: The loader won't show again during internal page navigation
4. **New Session**: Closing the browser tab/window clears the session, so the loader will show again on next visit

---

## Customization

### Adjusting Loader Duration

Open `src/App.tsx` and modify the `LOADER_CONFIG` object:

```tsx
const LOADER_CONFIG = {
  duration: 6000,  // Change this value (in milliseconds)
  // 3000 = 3 seconds
  // 6000 = 6 seconds (default - full animation cycle)
  // 8000 = 8 seconds
  ...
};
```

**Recommended durations:**
- **3000ms (3s)**: Quick intro, shows partial animation
- **6000ms (6s)**: Full animation cycle (default)
- **4000-5000ms**: Balanced option

---

### Changing Colors

Modify the `LOADER_CONFIG` in `src/App.tsx`:

```tsx
const LOADER_CONFIG = {
  duration: 6000,
  backgroundColor: "#ffffff",  // Loader background
  textColor: "#000000",        // "ZYRA" text color
  dotColor: "#000000",         // Animated dots color
};
```

**Example Color Schemes:**

#### Dark Theme
```tsx
const LOADER_CONFIG = {
  duration: 6000,
  backgroundColor: "#0a0a0a",  // Dark background
  textColor: "#ffffff",        // White text
  dotColor: "#ffffff",         // White dots
};
```

#### Brand Colors (Example)
```tsx
const LOADER_CONFIG = {
  duration: 6000,
  backgroundColor: "#f8f9fa",  // Light gray background
  textColor: "#6366f1",        // Indigo text
  dotColor: "#6366f1",         // Indigo dots
};
```

#### Gradient Effect (Advanced)
For a gradient background, you'll need to modify `ZyraLoader.tsx` directly:
```tsx
background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
```

---

## Testing the Loader

### To See the Loader Again:

**Option 1: Clear Session Storage**
1. Open browser DevTools (F12)
2. Go to "Application" or "Storage" tab
3. Find "Session Storage"
4. Delete the `zyra-loader-shown` key
5. Refresh the page

**Option 2: Open in Incognito/Private Window**
- The loader will show every time in a new incognito window

**Option 3: Close and Reopen Browser Tab**
- Completely close the tab/window and open a new one

---

## Disabling the Loader (Temporarily)

If you want to disable the loader during development:

**Option 1: Set duration to 0**
```tsx
const LOADER_CONFIG = {
  duration: 0,  // Loader will hide immediately
  ...
};
```

**Option 2: Comment out the wrapper**
In `App.tsx`, temporarily remove the `<AppWithLoader>` wrapper:
```tsx
// Before (with loader):
const App = () => (
  <AppWithLoader {...}>
    <QueryClientProvider>
      ...
    </QueryClientProvider>
  </AppWithLoader>
);

// After (without loader):
const App = () => (
  <QueryClientProvider client={queryClient}>
    ...
  </QueryClientProvider>
);
```

---

## Advanced Customization

### Changing the Text
Edit `src/components/ZyraLoader.tsx`, line 16:
```tsx
const letters = ["Z", "Y", "R", "A"];  // Change to your brand name
```

### Adjusting Animation Speed
In `ZyraLoader.tsx`, modify the timeout values:
```tsx
setTimeout(centerDots, 600);      // Faster: 400, Slower: 800
setTimeout(blowOutDots, 1200);    // Faster: 800, Slower: 1600
setTimeout(circleWave, 2300);     // Faster: 1800, Slower: 2800
setTimeout(typeLettersCentered, 3300);  // Faster: 2800, Slower: 3800
```

### Changing Dot Count/Size
In `ZyraLoader.tsx`:
```tsx
let dotCount = 260;  // More dots: 300+, Fewer dots: 150-200

// In the style section:
.dot {
  width: 3.5px;   // Larger: 4-5px, Smaller: 2-3px
  height: 3.5px;
  ...
}
```

---

## Troubleshooting

### Loader Shows on Every Page Load
- Check that you're using `sessionStorage` (not `localStorage`)
- Verify the session storage key is being set correctly
- Make sure you're not clearing session storage elsewhere in your code

### Loader Doesn't Show at All
- Check browser console for errors
- Verify `LOADER_CONFIG.duration` is greater than 0
- Clear your session storage and try again

### Colors Not Changing
- Make sure you're editing the `LOADER_CONFIG` object in `App.tsx`
- Check that color values are valid CSS colors (hex, rgb, or named colors)
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

---

## Performance Notes

- The loader uses CSS transitions and transforms for smooth animations
- Session storage is lightweight and doesn't impact performance
- The loader is completely removed from the DOM after it finishes
- No impact on subsequent page loads after the first visit

---

## Questions?

If you need further customization or run into issues, check:
1. Browser console for error messages
2. The three loader files mentioned above
3. Session storage in DevTools to verify the flag is being set

Enjoy your new loader! 🎉
