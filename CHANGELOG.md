# Changelog

All notable changes to IO.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Placeholder for future changes.

## [1.0.4] - 2025-10-10
### Added
- Added `fadeIn(duration, callback)` method for smooth fade-in animations with optional completion callback.
- Added `fadeOut(duration, callback)` method for smooth fade-out animations with optional completion callback.
- Added `fadeToggle(duration, callback)` method to toggle fade in/out based on element visibility.
- Added `once(event, handler)` method for one-time event listeners.
- Added `undelegate(event, selector, handler)` method to remove delegated event listeners.
- Added `clone(deep, setup)` method with optional setup callback for reattaching events to cloned elements.
- Added CSS variables support in `css()` method (e.g., `css('--primary-color', '#fff')`).
- Added `!important` flag support in `css()` method via third parameter.
- Added `detail` parameter to `trigger()` method for custom event data.

### Changed
- Updated `addClass()`, `removeClass()`, `toggleClass()` to support multiple classes (e.g., `addClass('class1', 'class2', 'class3')`).
- Updated `hasClass()` to check for multiple classes (returns true only if all classes are present).
- Updated `htmlAppend()`, `htmlPrepend()`, `htmlBefore()`, `htmlAfter()`, `htmlReplace()` to accept HTMLElement and IO instances in addition to HTML strings.
- Updated `toggleVisibility()` to use computed styles for accurate visibility detection.
- Improved `hide()` to store original display value in `data-io-display` attribute.
- Improved `show()` to restore original display value from `data-io-display`.

### Fixed
- Fixed memory leak in `fadeIn()` and `fadeOut()` by properly cleaning up event listeners on repeated calls.
- Fixed `fadeToggle()` to correctly determine element visibility using computed styles.
- Fixed event delegation cleanup in `undelegate()` method.

## [1.0.3] - 2025-10-01
### Added
- Added `native` method to return the first raw DOM element (`HTMLElement`) in the collection, or `null` if the collection is empty. Useful for direct DOM manipulation or integration with APIs expecting a single raw element (e.g., `$io('#element').native().focus()`).
- Added `allNative` method to return an array of all raw DOM elements (`HTMLElement[]`) in the collection. Ideal for bulk operations or integration with libraries requiring native DOM nodes (e.g., `$io('.item').allNative().forEach(el => el.className = 'new-class')`).

## [1.0.2] - 2025-09-25
### Added
- Placeholder for new features and improvements in version 1.0.2.

## [1.0.1] - 2025-09-24
### Added
- Added `forEach` method for iterating over elements, with `native = true` by default to pass `HTMLElement` and `native = false` to pass `IO` instance.
- Added new utility methods: `isEmptyValue`, `isNotEmptyValue`, `isEmptyData`, `isNotEmptyData`, `first`, `last`, `eq`, `count`, and `get` for enhanced DOM manipulation and querying.
- Added `options` parameter to `sanitizeXSS` for customizable allowed tags and attributes.

### Changed
- Updated `each` method to always pass `IO` instance (`native = false`), ensuring compatibility with `IO` instance methods like `on` and `data` (e.g., `$io().findAllByClass('js-btn').each(($e) => $e.on('click', ...))`).
- Updated all DOM-dependent methods (`show`, `hide`, `toggle`, `enable`, `disable`, `addClass`, `removeClass`, `toggleClass`, `removeClassBy`, `html`, `text`, `htmlAdd`, `htmlSub`, `htmlAppend`, `htmlPrepend`, `htmlBefore`, `htmlAfter`, `htmlReplace`, `append`, `prepend`, `remove`, `attr`, `removeAttr`, `aria`, `data`, `dataAdd`, `dataSub`, `val`, `css`, `on`, `off`, `click`, `delegate`, `trigger`) to use `forEach` with `native = true` for `HTMLElement` compatibility.

## [1.0.0] - 2025-09-24
### Added
- Initial release of IO.js with full DOM manipulation, event handling, and attribute management.
- Support for chainable API, XSS sanitization, and extensive selector methods.
