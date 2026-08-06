# 📸 Φίλτρα Cam

Κάμερα με **52 χρωματικά φίλτρα** (Instagram + Snapchat + TikTok στυλ) και
**56 εφέ προσώπου** (σκυλάκι, γατάκι, μονόκερος, κορώνες, καπέλα, ζωάκια,
καλειδοσκόπιο, glitch, pixel κ.ά.) — σαν το Snapchat, σε web app.

## Χρήση
1. Άνοιξε: **https://dkoniaris.github.io/camera-filters/** (χρειάζεται HTTPS για την κάμερα)
2. Πάτησε «Έναρξη Κάμερας» και δώσε άδεια κάμερας
3. Διάλεξε φίλτρο χρώματος (κάτω λωρίδα) ή εφέ προσώπου (μεσαία λωρίδα)
4. 📷 Φωτογραφία — 🔴 Βίντεο — 🖼️ Γκαλερί
5. Για app εμπειρία στο tablet: Μενού Chrome → «Προσθήκη στην αρχική οθόνη»

Υπάρχει και λειτουργία **«🧪 Δοκιμή»** χωρίς κάμερα (demo πρόσωπο).

## Τεχνικά
- `face-api.js` (TinyFaceDetector + 68 landmarks), μοντέλα τοπικά
- Canvas pipeline: CSS filters (ctx.filter) + FX + AR overlays (mirrored selfie)
- Φωτογραφία: `canvas.toBlob` · Βίντεο: `canvas.captureStream` + MediaRecorder
- PWA (manifest) για «Προσθήκη στην αρχική οθόνη»
