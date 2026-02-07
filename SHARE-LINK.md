# Make the app accessible to other users

## One-time: allow through firewall

**Right-click PowerShell → Run as administrator**, then run:

```powershell
cd "c:\Users\DELL PRECision 7550\Downloads\binary-rookies\binary-rookies"
.\start-for-sharing.ps1
```

The script will add a firewall rule (if needed), start backend and frontend in two windows, and print the **link to share**.

---

## Or run manually

1. **Firewall (PowerShell as Admin):**
   ```powershell
   New-NetFirewallRule -DisplayName "Binary Rookies Vite 5173" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Private
   ```

2. **Terminal 1 — Backend:**  
   `cd backend` → `npm run dev`

3. **Terminal 2 — Frontend:**  
   `cd frontend` → `npm run dev`

4. **Share link** (use your PC’s IP; frontend will also print it):  
   **http://YOUR_IP:5173/**  
   Example: **http://10.7.48.80:5173/**

---

Other users must be on the **same Wi‑Fi** as your PC. They open the link in a browser and can submit rumors (no CAPTCHA on shared link).
