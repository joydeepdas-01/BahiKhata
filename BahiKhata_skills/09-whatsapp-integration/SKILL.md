# BahiKhata WhatsApp Integration Skill

## Purpose
Safely open WhatsApp with a user-approved, pre-filled reminder.

## Invoke When
- Building or changing the Send on WhatsApp action.
- Changing phone normalization.
- Changing message URL encoding.
- Debugging Android WhatsApp behavior.

## Inputs
- Normalized phone number
- Rendered message
- Platform capabilities

## Outputs
- Valid WhatsApp deep link
- Android/web integration behavior
- Fallback/error state

## Allowed
- Generate `wa.me` links.
- URL-encode messages.
- Use Android-compatible deep-link/intent mechanisms where appropriate.
- Detect obvious invalid input.

## Forbidden
- Automatic message sending.
- WhatsApp Business API in V1.
- Scraping or automating WhatsApp UI.
- Claiming a message was delivered or read.

## Rules
1. User must perform the final Send action.
2. Never log unnecessary message content.
3. Phone normalization must be deterministic.
4. Integration failures must be recoverable.

## Verification
- Indian numbers and supported formats normalize correctly.
- Bengali/Hindi/English Unicode survives encoding.
- WhatsApp opens with correct recipient/message.
- Missing WhatsApp is handled gracefully.
