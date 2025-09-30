# Changelog

All notable changes to IO.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Placeholder for future changes.

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
