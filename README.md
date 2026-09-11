# Airborne Commander

Browser-based control stack for the Parrot MiniDrone Airborne. Fly the drone from a Mac with a PS5 DualSense controller — no mobile app, no native install.

## Why

Parrot's official app is mobile-only, and there is no turnkey desktop tool for this drone. Airborne Commander talks to it directly from the browser over Web Bluetooth, so the whole cockpit runs in a single tab.

## Features

- Web Bluetooth connection using the Parrot ARDrone3 BLE protocol
- PCMD command loop at 10 Hz — roll, pitch, yaw and throttle
- PS5 DualSense support through the Gamepad API, with a keyboard fallback
- Takeoff, landing, flips, LED control and onboard photo trigger
- Live battery telemetry through BLE notifications
- Cockpit interface with HUD overlay and camera view
- Experimental vision tracking: HSV colour detection driving a PD controller, with a manual override that acts as a kill switch

## Stack

React · Vite · Web Bluetooth API · Gamepad API · Canvas

## Requirements

Chrome is required — Web Bluetooth is not implemented in Safari or Firefox.

## Notes

The Airborne Night does not stream video over Bluetooth; photos are stored on the drone itself. The cockpit camera view is a canvas simulation, with an option to fall back to the Mac webcam.

## Status

Personal project, actively worked on.

---

Built by Elhadji Dioumanera — https://www.upwork.com/freelancers/~0185f86e6d9cb29b8f
