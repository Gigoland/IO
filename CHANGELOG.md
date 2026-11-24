# Changelog

All notable changes to IO.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Placeholder for future changes.

## [1.0.9] - 2026-11-24
### Security
- `sanitizeXSS` parsed the input with `innerHTML` on a `<div>` of the active document, so handlers such as `<img src=x onerror=...>` ran during sanitization. Parsing now happens in an inert `<template>`.
- `sanitizeXSS` accepted `href` values like `" javascript:..."`, `"java\tscript:..."` or `vbscript:...`. URL attributes (`href`, `src`, `action`, `formaction`, `srcset`, ...) are now checked against an allowlist of schemes (`allowedSchemes`, default `http`, `https`, `mailto`, `tel`) after removing whitespace and control characters; relative URLs are kept.
- `script`, `style`, `template`, `iframe`, `object`, `embed`, `svg`, `math`... are removed with their content instead of being unwrapped into text. Comments are removed.

### Fixed
- `sanitizeXSS` no longer alters plain text containing `javascript:` or `data:` (for example "Format data: CSV").
- `sanitizeXSS` merges partial options with the defaults (`{ allowedTags: ['b'] }` crashed).
- `$io('#id.class')` and other selectors starting with `#` were treated as an id; the id fast path now only applies to a plain id.
- `$io()` without argument returns an empty collection without warning.
- `val()` reads and writes `button`, `option`, `output` and `data` elements.
- `data()`, `dataAdd()`, `dataSub()` accept kebab-case names (`selected-label`).
- Finder methods escape their values (`findByName('a"b')` threw a selector error).
- `css('--custom-property')` returns the value of a CSS custom property.
- `tests/index.html` loaded `../dist/io.js`, which does not exist; it now loads `../src/io.js`.
- README: `sanitizeXSS` and `escapeRegExp` are static; `$io().sanitizeXSS()` and `$io().escapeRegExp()` now exist as aliases so the documented calls work.

### Changed
- Warnings go through `IO.debug` (default `false`). The published `dist/io.min.js` of 1.0.8 contained no warning at all while `src/io.js` had 55, so the default keeps the behaviour of the published file.
- README converted from UTF-16 to UTF-8 so that it diffs and renders as text.

### Performance
- `findBy`, `findById`, `findByClass`, `findByName`, `findByType`, `findByAttr` stop at the first match (`querySelector`) instead of collecting every match of every element and keeping one.
- `findAll*` methods no longer return duplicates when the collection contains nested elements.
- `css(prop, value, true)` writes each property once instead of twice.

## [1.0.8] - 2026-07-15
### Added
- Added internal `#normalizeClasses()` helper for consistent class name normalization.

### Changed
- Unified `addClass`, `removeClass`, `toggleClass`, and `hasClass` APIs to accept a string or an array of class names.
- `toggleClass()` now supports the optional `force` parameter, matching the native `DOMTokenList.toggle()` behavior.
- Improved class handling consistency across all class manipulation methods.

## [1.0.7] - 2026-05-17
### Fixed
- `fadeOut` now properly removes previous transition listeners before attaching new ones
- Fixed duplicate `transitionend` event execution during repeated fade animations
- Improved fade animation cleanup for better memory management
- Fixed display state restoration after `fadeOut` / `fadeIn` cycles
- Fixed Bootstrap `.d-none` conflicts when restoring element visibility via `show`, `fadeIn`, and `toggleVisibility`
- Fixed `sanitizeXSS`

### Added
- Added static `IO.plugin()` system for extending the library with custom methods

### Improved
- Improved plugin registration safety with duplicate method protection
- Improved internal transition handling stability

## [1.0.6] - 2026-05-03
### Fixed
- `htmlAppend` / `htmlPrepend` / `htmlBefore` / `htmlAfter` - `DocumentFragment` support

## [1.0.5] - 2025-12-24
### Added
- Support for creating elements from HTML strings in the constructor (e.g., `$io('<div class="x">Hello</div>')`).

### Changed
- Updated `show()` method to restore the original display value from `data-io-display` attribute.

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
