# HAR Capture Protocol

## Goal

Capture reproducible HAR traces for media-heavy routes so `verify:media:har` can compare the same scenario across stages.

## Required scenario metadata

- stage name
- scenario id
- route
- device/browser
- signed-in or signed-out state
- notes about wallet/auth prompts

## Capture rules

1. Start from a clean tab.
2. Preserve network log.
3. Disable cache.
4. Record the exact scenario from the scenario matrix.
5. Export the HAR immediately after the scenario.
6. Name the file as `har.<stage>.<scenario>.har`.

## Required route classes

- `/forum`
- `/exchange`
- `/about`
- `/ads/home`

## Mandatory annotations

- route transition points
- first interaction timestamp
- background/foreground transitions
- restore attempts
- widget failures if present
