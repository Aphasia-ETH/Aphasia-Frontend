# Chrome Extension Development Mode

## How Chrome Extensions Work with Vite

Unlike regular web apps, Chrome extensions **don't show a web URL** when running `npm run dev`. This is normal! 

The extension needs to be **loaded in Chrome** from the `dist/` folder.

---

## Quick Start

### 1. Start Dev Server
```bash
npm run dev
```

You'll see:
```
VITE v7.1.9  ready in 410 ms

B R O W S E R
E X T E N S I O N
T O O L S

➜  CRXJS: Load dist as unpacked extension
```

**This is correct!** No web URL is shown because it's a Chrome extension.

### 2. Load Extension in Chrome

1. **Open Chrome** and go to: `chrome://extensions/`
2. **Enable Developer mode** (toggle in top right)
3. **Click "Load unpacked"**
4. **Select the `dist/` folder** from your project:

   **For WSL (Windows Subsystem for Linux):**
   
   In the file picker, navigate to:
   ```
   \\wsl$\<your-distro-name>\home\ucefkh\projects\aphasiaHackathon\Aphasia-Frontend\aphasia\dist
   ```
   
   Or type in the address bar:
   ```
   \\wsl$\Ubuntu\home\ucefkh\projects\aphasiaHackathon\Aphasia-Frontend\aphasia\dist
   ```
   (Replace `Ubuntu` with your WSL distro name if different)
   
   **Alternative - Quick Access:**
   - In Windows Explorer, type `\\wsl$` in the address bar
   - Navigate to your distro → home → ucefkh → projects → aphasiaHackathon → Aphasia-Frontend → aphasia → dist
   
   **For Native Linux:**
   ```
   /home/ucefkh/projects/aphasiaHackathon/Aphasia-Frontend/aphasia/dist
   ```

5. The extension should appear in your extensions list!

### 3. Open the Extension

- **Click the extension icon** in Chrome toolbar to open the popup
- Or **right-click the extension icon** → "Open side panel" (if configured)

---

## Hot Reload

When you make changes to your code:
- Vite will rebuild automatically
- **Reload the extension** in Chrome:
  - Go to `chrome://extensions/`
  - Click the **reload icon** (circular arrow) on your extension
  - Or use the keyboard shortcut shown in the extension card

---

## Development Workflow

1. **Terminal 1**: Run `npm run dev` (keep it running)
2. **Terminal 2**: Run backend `npm run dev` (if needed)
3. **Chrome**: Load extension from `dist/` folder
4. **Make changes** → Vite rebuilds → **Reload extension** in Chrome

---

## Troubleshooting

### Extension Not Loading?
- Make sure you selected the **`dist/`** folder, not `src/` or root
- Check that `npm run dev` completed successfully
- Look for errors in the terminal

### Changes Not Appearing?
- **Reload the extension** in `chrome://extensions/`
- Check browser console (right-click extension → Inspect)
- Check terminal for build errors

### Want a Web Preview?
For Chrome extensions, there's no direct web preview. However, you can:
- Use `npm run preview` to preview the built extension (limited)
- Test individual components in a separate React app
- Use Chrome DevTools to debug the extension

---

## Port 6969

The dev server runs on port **6969** (configured in `vite.config.ts`). This is mainly for:
- HMR (Hot Module Replacement) connections
- Development tooling
- Not for direct browser access

---

## Summary

✅ **Normal**: No web URL shown  
✅ **Normal**: Need to load extension manually in Chrome  
✅ **Normal**: Extension lives in `dist/` folder  
✅ **Normal**: Need to reload extension after changes  

This is how Chrome extension development works! 🚀

