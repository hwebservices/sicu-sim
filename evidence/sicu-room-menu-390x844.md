# SICU room menu phone evidence

Captured at a 390 × 844 CSS-pixel viewport from the local feature preview with the 3D room running and fictional teaching data active.

- `sicu-room-menu-390x844-main.png` shows the room with the single Menu dock button and live vitals strip.
- `sicu-room-menu-390x844-sheet.png` shows the open menu with Views, Documentation, and Room actions; the SIM LIVE strip remains visible above the dock.

Additional local viewport checks covered 320 × 844 portrait, 844 × 390 landscape, and 1280 × 800 desktop. No horizontal overflow was observed. At 390 × 844, the menu button, monitor strip, and dock bounds do not overlap; title and clock remain separate. Menu action routing and Escape dismissal/focus restoration were exercised through Playwright.
