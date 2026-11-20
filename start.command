#!/bin/bash
# Double-click this file to start the Workout Tracker.
cd "$(dirname "$0")"
PORT=8000
IP=$(ipconfig getifaddr en0 2>/dev/null)

echo ""
echo "  Workout Tracker is running!"
echo ""
echo "  On this Mac:   http://localhost:$PORT"
[ -n "$IP" ] && echo "  On your phone: http://$IP:$PORT   (phone must be on the same Wi-Fi)"
echo ""
echo "  Keep this window open while using the app. Close it to stop."
echo ""

(sleep 1 && open "http://localhost:$PORT") &
python3 -m http.server $PORT --bind 0.0.0.0 > /dev/null 2>&1
