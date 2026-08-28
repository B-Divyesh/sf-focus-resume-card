# Landing-page copy audit

All landing-page and extension sentences were reviewed on 2026-08-28. The
headline has 7 words; every explanatory landing sentence is 22 words or fewer.
There are no banned plain-words terms in visitor-facing copy.

| Text | Words |
| --- | ---: |
| Resume interrupted coding with one next action. | 7 |
| For interrupted developers, it saves page context and shows one small action when you return. | 15 |
| Free core workflow | 3 |
| No account required | 3 |
| Card data stays in your browser | 6 |
| One marked place keeps the next action easy to find. | 10 |
| Use it before you switch tasks, not to organize your whole day. | 12 |
| The extension captures the current URL and selected text. | 9 |
| You can hide the title or selection first. | 9 |
| Write five to twelve words for a physical step you can start without replanning. | 15 |
| Open the extension later. | 4 |
| The saved card appears first and opens its page. | 10 |
| Selected text and screenshots are optional. | 6 |
| The next action is required. | 5 |
| The extension stores the card in this browser. | 8 |
| Cards, screenshots, selections, and preferences are stored locally. | 8 |
| There is no account, cloud sync, analytics SDK, or third-party runtime script. | 11 |
| Plus adds two color treatments and an optional quiet toolbar dot. | 11 |
| Capture, screenshots, redaction, resuming, and local storage stay included. | 9 |
| Download this package and load it as an unpacked extension. | 10 |
| See one saved action before you install. | 8 |

## Extension copy repair

The verifier found that the extension used several map metaphors for one saved
unit. Those labels now use the product terms below. Decorative class names and
the generated map illustration remain visual implementation details, not user
instructions.

| Previous copy | Current copy | Words |
| --- | --- | ---: |
| Trail marker | Saved card | 2 |
| Finding your trail marker… | Loading your saved card… | 4 |
| Waypoint 01 | Saved card | 2 |
| Your next physical action | Your next action | 3 |
| Resume this trail | Resume this page | 3 |
| Trail restored. Opening one saved page… | Card resumed. Opening the saved page… | 6 |
| Leave one marker | Save one card | 3 |
| Placing marker… | Saving card… | 2 |
| Map room | Settings | 1 |
| Map appearance | Appearance | 1 |
| Choose a map treatment | Choose a color treatment | 4 |
| Quiet toolbar marker | Quiet toolbar dot | 3 |

## Terminology

| Concept | One term |
| --- | --- |
| Saved unit | card |
| Required step | next action |
| Browser context | page context |
| Sample experience | demo |
| Optional paid edition | Plus |

Regression check: `tests/contract.test.ts` rejects the retired UI phrases in
all extension-facing HTML, TypeScript, and manifest copy.
