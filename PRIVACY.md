# Privacy Policy

**Last Updated:** October 22, 2025

## Data Collection

**We do NOT collect, store, or transmit any personal data.**

The extension operates entirely locally in your browser and only communicates with Twitch's official API.

## What Data is Stored Locally

- **Your Twitch Login:** Stored in browser to identify your account
- **Follow Lists Cache:** Cached for 12 hours to improve performance
- **Preferences:** Card type setting

All data remains on your device using browser's `storage.local` API.

## Network Requests

The extension makes requests **only** to Twitch's official API (`gql.twitch.tv`) to fetch follow lists. No data is sent to the developer or third parties.

## Permissions

- **storage:** Cache follow lists and save preferences
- **host_permissions (gql.twitch.tv):** Fetch data from Twitch API
- **content_scripts (twitch.tv):** Display widget on user cards

## Your Control

- Clear cache anytime via extension options
- Uninstall to remove all data
- No data leaves your browser except to Twitch API

## Contact

Questions? Open an issue: https://github.com/danidsnk/twitch-mutual-follows

---

**Summary:** No data collection. Everything stays local. Only talks to Twitch API.
