/**
 * IO - Modern lightweight DOM utility library
 * @version: 1.0.9
 * @author Gigol.net
 * @license: MIT License
 * @see: https://github.com/Gigoland/IO
 * @description: Lightweight utility for DOM manipulation, events, attributes, CSS, and HTML handling. Users are responsible for sanitizing HTML input using sanitizeXSS manually.
 */
class IO {
  /**
   * Log warnings to the console (invalid arguments, empty selectors...). Off by default.
   * @type {boolean}
   */
  static debug = false;

  /** Tags removed together with their content by sanitizeXSS. */
  static #DROP_WITH_CONTENT = ['script', 'style', 'template', 'iframe', 'frame', 'frameset', 'object', 'embed', 'noscript', 'noembed', 'xmp', 'svg', 'math'];

  /** Attributes holding a URL, checked against the allowed schemes by sanitizeXSS. */
  static #URL_ATTRIBUTES = ['href', 'src', 'xlink:href', 'action', 'formaction', 'srcset', 'poster', 'background'];

  /** Elements exposing a "value" property. */
  static #VALUE_ELEMENTS = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'OPTION', 'OUTPUT', 'DATA'];

  /**
   * Initialize elements based on selector type
   * @param {string|Element|NodeList|Array|Document} selector - The selector, element, NodeList, array of elements, or document
   * @param {Document|Element} [context=document] - The context for querying elements
   */
  constructor(selector, context = document) {
    // $io() without argument is a valid empty collection (used to reach helper methods).
    if (selector === undefined || selector === null) {
      this.elements = [];

      return;
    }

    if (typeof selector === 'string') {
      selector = selector.trim();

      if (selector.startsWith('<') && selector.endsWith('>')) {
        const template = document.createElement('template');
        template.innerHTML = selector;
        this.elements = Array.from(template.content.children);

        return;
      }

      if (selector === 'body') {
        if (!(context instanceof Document) || !context.body) {
          IO.#warn('IO: Invalid context or document.body not available');
          this.elements = [];
        } else {
          this.elements = [context.body];
        }
      } else if (/^#[^\s.#[\]:>+~,()='"\\*|^$]+$/.test(selector)) {
        // Fast path only for a plain id: "#menu.open" or "#a > b" go through querySelectorAll.
        const id = selector.slice(1);
        const element = context.getElementById && !(context instanceof DocumentFragment)
          ? context.getElementById(id)
          : context.querySelector(`#${CSS.escape(id)}`)
        ;

        if (element) {
          this.elements = [element];
        } else {
          this.elements = [];
        }
      } else {
        this.elements = Array.from(context.querySelectorAll(selector));

        if (this.elements.length === 0 && selector !== '') {
          IO.#warn(`IO: No elements found for selector "${selector}"`);
        }
      }
    } else if (selector instanceof Element) {
      this.elements = [selector];
    } else if (selector instanceof Document) {
      if (!selector.body) {
        IO.#warn('IO: document.body is not available');
        this.elements = [];
      } else {
        this.elements = [selector.body];
      }
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
      this.elements = Array.from(selector).filter(el => el instanceof Element);
    } else {
      this.elements = [];
      IO.#warn('IO: Invalid selector type');
    }

    this.elements ??= [];
  }

  /**
   * Iterate over all elements with native or IO instance
   * @param {function} callback - The callback function to execute for each element
   * @param {boolean} [native=true] - Whether to pass native element or IO instance to callback
   * @returns {IO} The IO instance for chaining
   */
  forEach(callback, native = true) {
    this.elements.forEach((el, i) => callback.call(el, native ? el : new IO(el), i));

    return this;
  }

  /**
   * Iterate over all elements with IO instance
   * @param {function} callback - The callback function to execute for each IO instance
   * @returns {IO} The IO instance for chaining
   */
  each(callback) {
    return this.forEach(callback, false);
  }

  /**
   * Get the native DOM element at the specified index
   * @param {number} [index=0] - The index of the element to return
   * @returns {HTMLElement|null} The DOM element or null if not found
   */
  native(index = 0) {
    if (!Number.isInteger(index)) {
      IO.#warn('native: Index must be an integer');

      return null;
    }

    return this.elements[index] ?? null;
  }

  /**
   * Get all native DOM elements
   * @returns {Array<HTMLElement>} Array of DOM elements
   */
  allNative() {
    return this.elements ?? [];
  }

  /*** Visibility Methods ***/

  /**
   * Show elements with optional forced display value
   * @param {boolean|string} [mode=false]
   *   - false → default logic
   *   - true → reset display ('')
   *   - string → force display value (e.g. 'flex', 'grid')
   * @returns {IO}
   */
  show(mode = false) {
    return this.forEach(el => {
      // force display if string is provided
      if (typeof mode === 'string') {
        el.style.display = mode;

        return;
      }

      const display = el.dataset.ioDisplay;
      el.classList.remove('d-none'); // Remove boostrap class

      if (getComputedStyle(el).opacity === '0') {
        el.style.opacity = '1';
      }

      el.style.display = mode === true
        ? ''
        : (display && display !== 'none' ? display : 'block')
      ;
    });
  }

  /**
   * Hide all elements
   * @returns {IO} The IO instance for chaining
   */
  hide() {
    return this.forEach(el => {
      el.dataset.ioDisplay = getComputedStyle(el).display;
      el.style.display = 'none';
    });
  }

  /**
   * Toggle visibility of all elements
   * @returns {IO} The IO instance for chaining
   */
  toggleVisibility() {
    return this.forEach(el => {
      const currentDisplay = getComputedStyle(el).display;

      if (currentDisplay === 'none') {
        const ioDisplay = el.dataset.ioDisplay || 'block';
        el.style.display = ioDisplay;
        el.classList.remove('d-none'); // Remove boostrap class

        if (getComputedStyle(el).opacity === '0') {
          el.style.opacity = '1';
        }
      } else {
        el.dataset.ioDisplay = currentDisplay;
        el.style.display = 'none';
      }
    });
  }

  /**
   * Fade in all elements
   * @param {number} [duration=400] - Animation duration in milliseconds
   * @param {Function} [callback] - Function to call after animation completes
   * @returns {IO} Current IO instance for chaining
   */
  fadeIn(duration = 400, callback = null) {
    return this.forEach(el => {
      // Remove any existing fade listener
      if (el._ioFadeHandler) {
        el.removeEventListener('transitionend', el._ioFadeHandler);
      }

      if (getComputedStyle(el).display !== 'none') {
        if (callback && typeof callback === 'function') {
          callback.call(el, el);
        }

        return;
      }

      el.classList.remove('d-none'); // Remove boostrap class
      // Set initial state
      el.style.opacity = '0';
      el.style.display = el.dataset.ioDisplay || 'block';
      el.offsetHeight; // Force reflow
      el.style.transition = `opacity ${duration}ms ease-in-out`;
      el.style.opacity = '1';

      // Cleanup and callback
      const handleTransitionEnd = () => {
        el.style.transition = '';
        el.removeEventListener('transitionend', handleTransitionEnd);
        delete el._ioFadeHandler;

        if (callback && typeof callback === 'function') {
          callback.call(el, el);
        }
      };

      el._ioFadeHandler = handleTransitionEnd;
      el.addEventListener('transitionend', handleTransitionEnd);
    });
  }

  /**
   * Fade out all elements
   * @param {number} [duration=400] - Animation duration in milliseconds
   * @param {Function} [callback] - Function to call after animation completes
   * @returns {IO} Current IO instance for chaining
   */
  fadeOut(duration = 400, callback = null) {
    return this.forEach(el => {
      // Remove any existing fade listener
      if (el._ioFadeHandler) {
        el.removeEventListener('transitionend', el._ioFadeHandler);
      }

      const ioDisplay = getComputedStyle(el).display;

      if (ioDisplay === 'none') {
        if (callback && typeof callback === 'function') {
          callback.call(el, el);
        }

        return;
      }

      el.dataset.ioDisplay = ioDisplay;
      // Set transition
      el.style.transition = `opacity ${duration}ms ease-in-out`;
      el.style.opacity = '0';

      // Hide and cleanup after animation
      const handleTransitionEnd = () => {
        el.style.display = 'none';
        el.style.transition = '';
        el.removeEventListener('transitionend', handleTransitionEnd);
        delete el._ioFadeHandler;

        if (callback && typeof callback === 'function') {
          callback.call(el, el);
        }
      };

      el._ioFadeHandler = handleTransitionEnd;
      el.addEventListener('transitionend', handleTransitionEnd);
    });
  }

  /**
   * Toggle fade in/out based on visibility
   * @param {number} [duration=400] - Animation duration in milliseconds
   * @param {Function} [callback] - Function to call after animation completes
   * @returns {IO} Current IO instance for chaining
   */
  fadeToggle(duration = 400, callback = null) {
    this.elements.forEach(el => {
      const instance = new IO(el);

      if (getComputedStyle(el).display !== 'none') {
        instance.fadeOut(duration, callback);
      } else {
        instance.fadeIn(duration, callback);
      }
    });

    return this;
  }

  /**
   * Enable all elements by removing disabled state and styles
   * @returns {IO} The IO instance for chaining
   */
  enable() {
    return this.forEach(el => {
      if ('disabled' in el) {
        el.disabled = false;
      }

      el.style.pointerEvents = el.dataset.ioPointerEvents || 'auto';
      el.classList.remove('disabled', 'opacity-25');
    });
  }

  /**
   * Disable all elements by adding disabled state and styles
   * @returns {IO} The IO instance for chaining
   */
  disable() {
    return this.forEach(el => {
      el.dataset.ioPointerEvents = getComputedStyle(el).pointerEvents;

      if ('disabled' in el) {
        el.disabled = true;
      }

      el.style.pointerEvents = 'none';
      el.classList.add('disabled', 'opacity-25');
    });
  }

  /*** Class Methods ***/

  /**
   * Add one or more classes to all elements.
   * @param {string|string[]} classes
   * @returns {IO} The IO instance for chaining.
   */
  addClass(classes) {
    const classList = this.#normalizeClasses(classes);

    if (!classList.length) {
      IO.#warn('addClass: Invalid class name(s)');

      return this;
    }

    this.elements.forEach(el => el.classList.add(...classList));

    return this;
  }

  /**
   * Remove one or more classes from all elements.
   * @param {string|string[]} classes
   * @returns {IO} The IO instance for chaining.
   */
  removeClass(classes) {
    const classList = this.#normalizeClasses(classes);

    if (!classList.length) {
      IO.#warn('removeClass: Invalid class name(s)');

      return this;
    }

    this.elements.forEach(el => el.classList.remove(...classList));

    return this;
  }

  /**
   * Toggle one or more classes on all elements.
   * @param {string|string[]} classes
   * @param {boolean} [isForce]
   * @returns {IO} The IO instance for chaining.
   */
  toggleClass(classes, isForce) {
    const classList = this.#normalizeClasses(classes);

    if (!classList.length) {
      IO.#warn('toggleClass: Invalid class name(s)');

      return this;
    }

    this.elements.forEach(el => {
      classList.forEach(className => {
        if (arguments.length === 1) {
          el.classList.toggle(className);
        } else {
          el.classList.toggle(className, isForce);
        }
      });
    });

    return this;
  }

  /**
   * Check if the first element has all specified classes.
   * @param {string|string[]} classes
   * @returns {boolean}
   */
  hasClass(classes) {
    const classList = this.#normalizeClasses(classes);

    if (!classList.length) {
      IO.#warn('hasClass: Invalid class name(s)');

      return false;
    }

    return this.elements[0]
      ? classList.every(className => this.elements[0].classList.contains(className))
      : false
    ;
  }

  /*** HTML & Text Methods ***/

  /**
   * Get or set the text content of the first element
   * @param {string|number} [val] - The text to set
   * @returns {string|null|IO} The text content of the first element or the IO instance for chaining
   */
  text(val) {
    if (val === undefined) {
      if (this.elements[0]) {
        return this.elements[0].textContent;
      }

      return null;
    }

    if (typeof val !== 'string' && typeof val !== 'number') {
      IO.#warn('text: Invalid value, expected string or number');

      return this;
    }

    return this.forEach(el => el.textContent = val);
  }

  /**
   * Get or set the HTML content of the first element (sanitize input manually using sanitizeXSS)
   * @param {string|number} [val] - The HTML to set
   * @returns {string|null|IO} The HTML content of the first element or the IO instance for chaining
   */
  html(val) {
    if (val === undefined) {
      if (this.elements[0]) {
        return this.elements[0].innerHTML;
      }

      return null;
    }

    if (typeof val !== 'string' && typeof val !== 'number') {
      IO.#warn('html: Invalid value, expected string or number');

      return this;
    }

    return this.forEach(el => el.innerHTML = String(val));
  }

  /**
   * Add value to the HTML content of elements (numeric or string concatenation; sanitize input manually using sanitizeXSS)
   * @param {string|number} val - The value to add
   * @returns {IO} The IO instance for chaining
   */
  htmlAdd(val) {
    if (typeof val !== 'string' && typeof val !== 'number') {
      IO.#warn('htmlAdd: Invalid value, expected string or number');

      return this;
    }

    return this.forEach(el => {
      const currentText = el.textContent.trim();

      if (typeof val === 'number' && !isNaN(parseFloat(currentText)) && Number.isFinite(parseFloat(currentText))) {
        el.innerHTML = (parseFloat(currentText) + val).toString();
      } else {
        el.innerHTML += String(val);
      }
    });
  }

  /**
   * Subtract value from the HTML content of elements (numeric or string replacement)
   * @param {string|number} val - The value to subtract
   * @returns {IO} The IO instance for chaining
   */
  htmlSub(val) {
    if (typeof val !== 'string' && typeof val !== 'number') {
      IO.#warn('htmlSub: Invalid value, expected string or number');

      return this;
    }

    return this.forEach(el => {
      const currentText = el.textContent.trim();

      if (typeof val === 'number' && !isNaN(parseFloat(currentText)) && Number.isFinite(parseFloat(currentText))) {
        el.innerHTML = (parseFloat(currentText) - val).toString();
      } else {
        el.innerHTML = el.innerHTML.replace(new RegExp(IO.escapeRegExp(String(val)), 'g'), '');
      }
    });
  }

  /**
   * Append HTML or elements to all elements (sanitize input manually using sanitizeXSS)
   * @param {string|HTMLElement|IO} val - The HTML, element, or IO instance to append
   * @returns {IO} The IO instance for chaining
   */
  htmlAppend(val) {
    if (val instanceof IO && val.elements.length === 0) {
      IO.#warn('htmlAppend: IO instance has no elements');

      return this;
    }

    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('beforeend', val.trim());
      } else if (val instanceof HTMLElement || val instanceof DocumentFragment) {
        const nodeToAppend = i < this.elements.length - 1 ? val.cloneNode(true) : val;
        el.appendChild(nodeToAppend);
      } else if (val instanceof IO) {
        val.elements.forEach((child, j) => {
          const shouldClone = !(i === this.elements.length - 1 && j === val.elements.length - 1);
          el.appendChild(shouldClone ? child.cloneNode(true) : child);
        });
      } else {
        IO.#warn('htmlAppend: Invalid value', val);
      }
    });
  }

  /**
   * Prepend HTML or elements to all elements (sanitize input manually using sanitizeXSS)
   * @param {string|HTMLElement|IO} val - The HTML, element, or IO instance to prepend
   * @returns {IO} The IO instance for chaining
   */
  htmlPrepend(val) {
    if (val instanceof IO && val.elements.length === 0) {
      IO.#warn('htmlPrepend: IO instance has no elements');

      return this;
    }

    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('afterbegin', val.trim());
      } else if (val instanceof HTMLElement || val instanceof DocumentFragment) {
        const nodeToPrepend = i < this.elements.length - 1 ? val.cloneNode(true) : val;
        el.insertBefore(nodeToPrepend, el.firstChild);
      } else if (val instanceof IO) {
        // Reverse order for prepend to maintain original sequence
        const reversedChildren = Array.from(val.elements).reverse();
        reversedChildren.forEach((child, j) => {
          const shouldClone = !(i === this.elements.length - 1 && j === reversedChildren.length - 1);
          el.insertBefore(shouldClone ? child.cloneNode(true) : child, el.firstChild);
        });
      } else {
        IO.#warn('htmlPrepend: Invalid value', val);
      }
    });
  }

  /**
   * Insert HTML or elements before all elements (sanitize input manually using sanitizeXSS)
   * @param {string|HTMLElement|IO} val - The HTML, element, or IO instance to insert
   * @returns {IO} The IO instance for chaining
   */
  htmlBefore(val) {
    if (val instanceof IO && val.elements.length === 0) {
      IO.#warn('htmlBefore: IO instance has no elements');

      return this;
    }

    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('beforebegin', val.trim());
      } else if (val instanceof HTMLElement || val instanceof DocumentFragment) {
        const nodeToInsert = i < this.elements.length - 1 ? val.cloneNode(true) : val;
        el.parentNode.insertBefore(nodeToInsert, el);
      } else if (val instanceof IO) {
        val.elements.forEach((child, j) => {
          const shouldClone = !(i === this.elements.length - 1 && j === val.elements.length - 1);
          el.parentNode.insertBefore(shouldClone ? child.cloneNode(true) : child, el);
        });
      } else {
        IO.#warn('htmlBefore: Invalid value', val);
      }
    });
  }

  /**
   * Insert HTML or elements after all elements (sanitize input manually using sanitizeXSS)
   * @param {string|HTMLElement|IO} val - The HTML, element, or IO instance to insert
   * @returns {IO} The IO instance for chaining
   */
  htmlAfter(val) {
    if (val instanceof IO && val.elements.length === 0) {
      IO.#warn('htmlAfter: IO instance has no elements');

      return this;
    }

    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('afterend', val.trim());
      } else if (val instanceof HTMLElement || val instanceof DocumentFragment) {
        const nodeToInsert = i < this.elements.length - 1 ? val.cloneNode(true) : val;
        el.parentNode.insertBefore(nodeToInsert, el.nextSibling);
      } else if (val instanceof IO) {
        // Reverse for maintaining order when inserting after
        Array.from(val.elements).reverse().forEach((child, j) => {
          const shouldClone = !(i === this.elements.length - 1 && j === val.elements.length - 1);
          el.parentNode.insertBefore(shouldClone ? child.cloneNode(true) : child, el.nextSibling);
        });
      } else {
        IO.#warn('htmlAfter: Invalid value', val);
      }
    });
  }

  /**
   * Replace all elements with HTML or elements (sanitize input manually using sanitizeXSS)
   * @param {string|HTMLElement|IO} val - The HTML, element, or IO instance to replace with
   * @returns {IO} The IO instance for chaining
   */
  htmlReplace(val) {
    if (val instanceof IO && val.elements.length === 0) {
      IO.#warn('htmlReplace: IO instance has no elements');

      return this;
    }

    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('beforebegin', val.trim());
        el.remove();
      } else if (val instanceof HTMLElement || val instanceof DocumentFragment) {
        const nodeToReplace = i < this.elements.length - 1 ? val.cloneNode(true) : val;
        el.parentNode.replaceChild(nodeToReplace, el);
      } else if (val instanceof IO) {
        const parent = el.parentNode;
        val.elements.forEach((child, j) => {
          const shouldClone = !(i === this.elements.length - 1 && j === val.elements.length - 1);
          parent.insertBefore(shouldClone ? child.cloneNode(true) : child, el);
        });
        parent.removeChild(el);
      } else {
        IO.#warn('htmlReplace: Invalid value', val);
      }
    });
  }

  /*** DOM Manipulation Methods ***/

  /**
   * Remove all elements from the DOM
   * @returns {IO} The IO instance for chaining
   */
  remove() {
    return this.forEach(el => el.remove());
  }

  /*** Attribute & Value Methods ***/

  /**
   * Get or set an attribute on all elements
   * @param {string} name - The attribute name
   * @param {string} [value] - The attribute value to set
   * @returns {string|null|IO} The attribute value of the first element or the IO instance for chaining
   */
  attr(name, value) {
    if (!name || typeof name !== 'string') {
      IO.#warn('attr: Invalid attribute name');

      if (value === undefined) {
        return null;
      }

      return this;
    }

    if (value === undefined) {
      if (this.elements[0]) {
        return this.elements[0].getAttribute(name);
      }

      return null;
    }

    return this.forEach(el => el.setAttribute(name, value));
  }

  /**
   * Remove an attribute from all elements
   * @param {string} name - The attribute name to remove
   * @returns {IO} The IO instance for chaining
   */
  removeAttr(name) {
    if (!name || typeof name !== 'string') {
      IO.#warn('removeAttr: Invalid attribute name');

      return this;
    }

    return this.forEach(el => el.removeAttribute(name));
  }

  /**
   * Get or set an ARIA attribute on all elements
   * @param {string} param - The ARIA attribute name (without 'aria-' prefix)
   * @param {string} [val] - The ARIA attribute value to set
   * @returns {string|null|IO} The ARIA attribute value of the first element or the IO instance for chaining
   */
  aria(param, val) {
    if (!param || typeof param !== 'string') {
      IO.#warn('aria: Invalid aria attribute');

      if (val === undefined) {
        return null;
      }

      return this;
    }

    if (val === undefined) {
      if (this.elements[0]) {
        return this.elements[0].getAttribute(`aria-${param}`);
      }

      return null;
    }

    return this.forEach(el => el.setAttribute(`aria-${param}`, val));
  }

  /**
   * Get or set a data attribute on all elements
   * @param {string} name - The data attribute name (without 'data-' prefix)
   * @param {string|number} [value] - The data attribute value to set
   * @returns {string|null|IO} The data attribute value of the first element or the IO instance for chaining
   */
  data(name, value) {
    if (!name || typeof name !== 'string') {
      IO.#warn('data: Invalid data attribute name');

      if (value === undefined) {
        return null;
      }

      return this;
    }

    const key = IO.#dataKey(name);

    if (value === undefined) {
      if (this.elements[0]) {
        return this.elements[0].dataset[key];
      }

      return null;
    }

    return this.forEach(el => el.dataset[key] = value);
  }

  /**
   * Add a value to a data attribute (numeric or string concatenation)
   * @param {string} param - The data attribute name (without 'data-' prefix)
   * @param {string|number} val - The value to add
   * @returns {IO} The IO instance for chaining
   */
  dataAdd(param, val) {
    if (!param || typeof param !== 'string' || val === undefined) {
      IO.#warn('dataAdd: Invalid parameter or value');

      return this;
    }

    const key = IO.#dataKey(param);

    return this.forEach(el => {
      const current = el.dataset[key] || '';

      if (typeof val === 'number' && !isNaN(parseFloat(current)) && Number.isFinite(parseFloat(current))) {
        el.dataset[key] = (parseFloat(current) + val).toString();
      } else {
        el.dataset[key] = current + val;
      }
    });
  }

  /**
   * Subtract a value from a data attribute (numeric or string replacement)
   * @param {string} param - The data attribute name (without 'data-' prefix)
   * @param {string|number} val - The value to subtract
   * @returns {IO} The IO instance for chaining
   */
  dataSub(param, val) {
    if (!param || typeof param !== 'string' || val === undefined) {
      IO.#warn('dataSub: Invalid parameter or value');

      return this;
    }

    const key = IO.#dataKey(param);

    return this.forEach(el => {
      const current = el.dataset[key] || '';

      if (typeof val === 'number' && !isNaN(parseFloat(current)) && Number.isFinite(parseFloat(current))) {
        el.dataset[key] = (parseFloat(current) - val).toString();
      } else {
        el.dataset[key] = current.replace(new RegExp(IO.escapeRegExp(String(val)), 'g'), '');
      }
    });
  }

  /**
   * Get all data attributes of the first element
   * @returns {Array<Array<string>>} Array of key-value pairs of data attributes
   */
  dataAll() {
    if (this.elements[0]) {
      return Object.entries(this.elements[0].dataset);
    }

    return [];
  }

  /**
   * Get or set the value of form elements
   * @param {string|number} [value] - The value to set
   * @returns {string|null|IO} The value of the first element or the IO instance for chaining
   */
  val(value) {
    if (value === undefined) {
      if (this.elements[0] && IO.#hasValue(this.elements[0])) {
        return this.elements[0].value;
      }

      return null;
    }

    return this.forEach(el => {
      if (IO.#hasValue(el)) {
        el.value = value != null ? String(value) : '';
      }
    });
  }

  /*** CSS Methods ***/

  /**
   * Get or set CSS styles on all elements
   * @param {string|Object} prop - The CSS property name or object of properties
   * @param {string} [value] - The CSS property value
   * @param {boolean} [important=false] - Whether to apply !important to styles
   * @returns {string|null|IO} The computed style value of the first element or the IO instance for chaining
   */
  css(prop, value, important = false) {
    if (typeof prop === 'string' && value === undefined) {
      if (this.elements[0]) {
        const style = getComputedStyle(this.elements[0]);

        return prop.startsWith('--') ? style.getPropertyValue(prop).trim() : style[prop];
      }

      return null;
    }

    if (typeof prop !== 'string' && typeof prop !== 'object') {
      IO.#warn('css: Invalid property');

      return this;
    }

    return this.forEach(el => {
      if (typeof prop === 'object') {
        for (const key in prop) {
          this.#setStyle(el, key, prop[key], important);
        }
      } else {
        this.#setStyle(el, prop, value, important);
      }
    });
  }

  /*** Event Methods ***/

  /**
   * Add an event listener to all elements
   * @param {string} event - The event type
   * @param {function} handler - The event handler
   * @returns {IO} The IO instance for chaining
   */
  on(event, handler) {
    if (!event || !handler || typeof event !== 'string' || typeof handler !== 'function') {
      IO.#warn('on: Invalid event or handler');

      return this;
    }

    return this.forEach(el => el.addEventListener(event, handler));
  }

  /**
   * Remove an event listener from all elements
   * @param {string} event - The event type
   * @param {function} handler - The event handler to remove
   * @returns {IO} The IO instance for chaining
   */
  off(event, handler) {
    if (!event || !handler || typeof event !== 'string' || typeof handler !== 'function') {
      IO.#warn('off: Invalid event or handler');

      return this;
    }

    return this.forEach(el => el.removeEventListener(event, handler));
  }

  /**
   * Add a one-time event listener to all elements
   * @param {string} event - The event type
   * @param {function} handler - The event handler
   * @returns {IO} The IO instance for chaining
   */
  once(event, handler) {
    return this.forEach(el => el.addEventListener(event, handler, { once: true }));
  }

  /**
   * Delegate an event to elements matching a selector
   * @param {string} event - The event type
   * @param {string} selector - The CSS selector for target elements
   * @param {function} handler - The event handler
   * @returns {IO} The IO instance for chaining
   */
  delegate(event, selector, handler) {
    if (!event || !selector || !handler || typeof event !== 'string' || typeof selector !== 'string' || typeof handler !== 'function') {
      IO.#warn('delegate: Invalid event, selector, or handler');

      return this;
    }

    return this.forEach(el => {
      if (!el._ioDelegates) {
        el._ioDelegates = new Map();
      }

      const wrapper = (e) => {
        const target = e.target.closest(selector);

        if (target && el.contains(target)) {
          handler.call(target, e);
        }
      };

      const key = `${event}::${selector}`;

      if (!el._ioDelegates.has(key)) {
        el._ioDelegates.set(key, new Map());
      }

      const handlersMap = el._ioDelegates.get(key);

      if (!handlersMap.has(handler)) {
        handlersMap.set(handler, wrapper);
        el.addEventListener(event, wrapper);
      }
    });
  }

  /**
   * Remove delegated event listeners
   * @param {string} event - The event type
   * @param {string} selector - The CSS selector
   * @param {function} [handler] - Optional specific handler to remove
   * @returns {IO} The IO instance for chaining
   */
  undelegate(event, selector, handler) {
    if (!event || !selector || typeof event !== 'string' || typeof selector !== 'string') {
      IO.#warn('undelegate: Invalid event or selector');

      return this;
    }

    return this.forEach(el => {
      if (!el._ioDelegates) {
        return;
      }

      const key = `${event}::${selector}`;
      const handlersMap = el._ioDelegates.get(key);

      if (handlersMap) {
        if (handler && typeof handler === 'function') {
          const wrapper = handlersMap.get(handler);

          if (wrapper) {
            el.removeEventListener(event, wrapper);
            handlersMap.delete(handler);
          }

          if (handlersMap.size === 0) {
            el._ioDelegates.delete(key);
          }
        } else {
          for (const wrapper of handlersMap.values()) {
            el.removeEventListener(event, wrapper);
          }

          el._ioDelegates.delete(key);
        }

        if (el._ioDelegates.size === 0) {
          delete el._ioDelegates;
        }
      }
    });
  }

  /**
   * Trigger a custom or native event on all elements
   * @param {string} eventType - The event type
   * @param {Object} [options={ bubbles: true, cancelable: true }] - Event options
   * @param {any} [detail=null] - Custom event detail
   * @returns {IO} The IO instance for chaining
   */
  trigger(eventType, options = { bubbles: true, cancelable: true }, detail = null) {
    if (!eventType || typeof eventType !== 'string') {
      IO.#warn('trigger: Invalid event type');

      return this;
    }

    return this.forEach(el => {
      const event = detail ? new CustomEvent(eventType, { ...options, detail }) : new Event(eventType, options);
      el.dispatchEvent(event);
    });
  }

  /*** Search Methods ***/

  /**
   * Find the first element by selector within elements
   * @param {string} target - The CSS selector
   * @returns {IO} A new IO instance with the first matching element
   */
  findBy(target) {
    if (!target || typeof target !== 'string') {
      IO.#warn('findBy: Invalid selector');

      return new IO([]);
    }

    return this.#first(target);
  }

  /**
   * Find all elements by selector within elements
   * @param {string} target - The CSS selector
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllBy(target) {
    if (!target || typeof target !== 'string') {
      IO.#warn('findAllBy: Invalid selector');

      return new IO([]);
    }

    return this.#all(target);
  }

  /**
   * Find the first element by ID within elements
   * @param {string} id - The ID to find
   * @returns {IO} A new IO instance with the first matching element
   */
  findById(id) {
    if (!id || typeof id !== 'string') {
      IO.#warn('findById: Invalid ID');

      return new IO([]);
    }

    return this.#first(`#${CSS.escape(id)}`);
  }

  /**
   * Find the first element by class within elements
   * @param {string} className - The class name to find
   * @returns {IO} A new IO instance with the first matching element
   */
  findByClass(className) {
    if (!className || typeof className !== 'string') {
      IO.#warn('findByClass: Invalid class name');

      return new IO([]);
    }

    return this.#first(`.${CSS.escape(className)}`);
  }

  /**
   * Find all elements by class within elements
   * @param {string} className - The class name to find
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllByClass(className) {
    if (!className || typeof className !== 'string') {
      IO.#warn('findAllByClass: Invalid class name');

      return new IO([]);
    }

    return this.#all(`.${CSS.escape(className)}`);
  }

  /**
   * Find the first element by name attribute within elements
   * @param {string} name - The name attribute to find
   * @returns {IO} A new IO instance with the first matching element
   */
  findByName(name) {
    if (!name || typeof name !== 'string') {
      IO.#warn('findByName: Invalid name');

      return new IO([]);
    }

    return this.#first(`[name="${CSS.escape(name)}"]`);
  }

  /**
   * Find all elements by name attribute within elements
   * @param {string} name - The name attribute to find
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllByName(name) {
    if (!name || typeof name !== 'string') {
      IO.#warn('findAllByName: Invalid name');

      return new IO([]);
    }

    return this.#all(`[name="${CSS.escape(name)}"]`);
  }

  /**
   * Find the first element by type attribute within elements
   * @param {string} type - The type attribute to find
   * @returns {IO} A new IO instance with the first matching element
   */
  findByType(type) {
    if (!type || typeof type !== 'string') {
      IO.#warn('findByType: Invalid type');

      return new IO([]);
    }

    return this.#first(`[type="${CSS.escape(type)}"]`);
  }

  /**
   * Find all elements by type attribute within elements
   * @param {string} type - The type attribute to find
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllByType(type) {
    if (!type || typeof type !== 'string') {
      IO.#warn('findAllByType: Invalid type');

      return new IO([]);
    }

    return this.#all(`[type="${CSS.escape(type)}"]`);
  }

  /**
   * Find the first element by attribute within elements
   * @param {string} attr - The attribute name
   * @param {string} [val] - The attribute value
   * @returns {IO} A new IO instance with the first matching element
   */
  findByAttr(attr, val) {
    if (!attr || typeof attr !== 'string') {
      IO.#warn('findByAttr: Invalid attribute');

      return new IO([]);
    }

    return this.#first(val !== undefined ? `[${CSS.escape(attr)}="${CSS.escape(String(val))}"]` : `[${CSS.escape(attr)}]`);
  }

  /**
   * Find all elements by attribute within elements
   * @param {string} attr - The attribute name
   * @param {string} [val] - The attribute value
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllByAttr(attr, val) {
    if (!attr || typeof attr !== 'string') {
      IO.#warn('findAllByAttr: Invalid attribute');

      return new IO([]);
    }

    return this.#all(val !== undefined ? `[${CSS.escape(attr)}="${CSS.escape(String(val))}"]` : `[${CSS.escape(attr)}]`);
  }

  /**
   * Find the closest parent by ID
   * @param {string} id - The ID to find
   * @returns {IO} A new IO instance with the closest matching parent
   */
  findParentById(id) {
    if (!id || typeof id !== 'string') {
      IO.#warn('findParentById: Invalid ID');

      return new IO([]);
    }

    const safeId = CSS.escape(id);

    return new IO(this.elements.map(el => el.closest(`#${safeId}`)).filter(Boolean));
  }

  /**
   * Find the closest parent by class
   * @param {string} className - The class name to find
   * @returns {IO} A new IO instance with the closest matching parent
   */
  findParentByClass(className) {
    if (!className || typeof className !== 'string') {
      IO.#warn('findParentByClass: Invalid class name');

      return new IO([]);
    }

    return new IO(this.elements.map(el => el.closest(`.${CSS.escape(className)}`)).filter(Boolean));
  }

  /*** Utility Methods ***/

  /**
   * Check if the value of the first element is empty
   * @param {boolean} [strictZero=true] - Whether to treat 0 as empty
   * @returns {boolean} True if the value is empty, false otherwise
   */
  isEmptyValue(strictZero = true) {
    const value = this.val();

    return (typeof value === 'undefined' || ['false', 'null', false, null, ''].includes(value) || (strictZero && value === 0));
  }

  /**
   * Check if a data attribute of the first element is empty
   * @param {string} param - The data attribute name (without 'data-' prefix)
   * @param {boolean} [strictZero=true] - Whether to treat 0 as empty
   * @returns {boolean} True if the data attribute is empty, false otherwise
   */
  isEmptyData(param, strictZero = true) {
    if (!param || typeof param !== 'string') {
      IO.#warn('isEmptyData: Invalid parameter');

      return true;
    }

    const data = this.data(param);

    return (typeof data === 'undefined' || ['false', 'null', false, null, ''].includes(data) || (strictZero && data === 0));
  }

  /**
   * Check if the value of the first element is not empty
   * @param {boolean} [strictZero=true] - Whether to treat 0 as empty
   * @returns {boolean} True if the value is not empty, false otherwise
   */
  isNotEmptyValue(strictZero = true) {
    return !this.isEmptyValue(strictZero);
  }

  /**
   * Check if a data attribute of the first element is not empty
   * @param {string} param - The data attribute name (without 'data-' prefix)
   * @param {boolean} [strictZero=true] - Whether to treat 0 as empty
   * @returns {boolean} True if the data attribute is not empty, false otherwise
   */
  isNotEmptyData(param, strictZero = true) {
    return !this.isEmptyData(param, strictZero);
  }

  /**
   * Check if any elements exist in the collection
   * @returns {boolean} True if elements exist, false otherwise
   */
  exists() {
    return this.elements.length > 0;
  }

  /**
   * Return the first element as a new IO instance
   * @returns {IO} A new IO instance with the first element
   */
  first() {
    return new IO(this.elements[0] ?? []);
  }

  /**
   * Return the last element as a new IO instance
   * @returns {IO} A new IO instance with the last element
   */
  last() {
    return new IO(this.elements[this.elements.length - 1] ?? []);
  }

  /**
   * Return the element at the specified index as a new IO instance
   * @param {number} index - The index of the element
   * @returns {IO} A new IO instance with the element at the index
   */
  eq(index) {
    return new IO(this.elements[index] ?? []);
  }

  /**
   * Clone all elements (deep clone 1 setup events optional)
   * @param {boolean} [deep=true] - Whether to perform a deep clone including child nodes
   * @param {Function} [setup] - Function to setup events on cloned elements
   * @returns {IO} A new IO instance containing the cloned elements
   */
  clone(deep = true, setup = null) {
    const cloned = new IO(this.elements.map(el => el.cloneNode(deep)));

    if (setup && typeof setup === 'function') {
      setup(cloned);
    }

    return cloned;
  }

  /**
   * Get the number of elements in the collection
   * @returns {number} The number of elements
   */
  count() {
    return this.elements.length;
  }

  /**
   * Escape a string for use in RegExp
   * @param {string} str - The string to escape
   * @returns {string} The escaped string
   */
  static escapeRegExp(str) {
    return str.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Sanitize an HTML string to prevent XSS
   * The string is parsed inside a <template>: its content is inert, so no image is loaded and no
   * event handler runs during parsing. script/style/iframe/svg... are removed with their content,
   * other disallowed tags are unwrapped, URL attributes must use an allowed scheme.
   * @param {string} str - The HTML string to sanitize
   * @param {Object} [options] - Sanitization options (missing keys use the defaults)
   * @param {string[]} [options.allowedTags=['b', 'i', 'u', 'strong', 'em', 'p', 'div', 'span', 'a', 'br']] - Allowed HTML tags
   * @param {string[]} [options.allowedAttributes=['src', 'href', 'class', 'id']] - Allowed HTML attributes
   * @param {string[]} [options.allowedSchemes=['http', 'https', 'mailto', 'tel']] - Allowed URL schemes (relative URLs are always allowed)
   * @returns {string} - HTML-safe string
   */
  static sanitizeXSS(str, options = {}) {
    if (typeof str !== 'string') {
      IO.#warn('sanitizeXSS: Invalid input, expected string');

      return '';
    }

    const lower = list => list.map(item => String(item).toLowerCase());
    const allowedTags = lower(options.allowedTags ?? ['b', 'i', 'u', 'strong', 'em', 'p', 'div', 'span', 'a', 'br']);
    const allowedAttributes = lower(options.allowedAttributes ?? ['src', 'href', 'class', 'id']);
    const allowedSchemes = lower(options.allowedSchemes ?? ['http', 'https', 'mailto', 'tel']);

    const template = document.createElement('template');
    template.innerHTML = str;

    const clean = parent => {
      Array.from(parent.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
          node.remove(); // comments, processing instructions

          return;
        }

        const tagName = node.tagName.toLowerCase();

        if (IO.#DROP_WITH_CONTENT.includes(tagName)) {
          node.remove();

          return;
        }

        clean(node);

        if (!allowedTags.includes(tagName)) {
          node.replaceWith(...node.childNodes);

          return;
        }

        Array.from(node.attributes).forEach(attr => {
          const attrName = attr.name.toLowerCase();

          if (attrName === 'style'
           || attrName.startsWith('on')
           || !allowedAttributes.includes(attrName)
           || (IO.#URL_ATTRIBUTES.includes(attrName) && !IO.#isSafeUrl(attr.value, allowedSchemes))
          ) {
            node.removeAttribute(attr.name);
          }
        });
      });
    };

    clean(template.content);

    return template.innerHTML;
  }

  /**
   * Instance alias of IO.sanitizeXSS, so that $io().sanitizeXSS(...) also works
   * @param {string} str
   * @param {Object} [options]
   * @returns {string}
   */
  sanitizeXSS(str, options) {
    return IO.sanitizeXSS(str, options);
  }

  /**
   * Instance alias of IO.escapeRegExp, so that $io().escapeRegExp(...) also works
   * @param {string} str
   * @returns {string}
   */
  escapeRegExp(str) {
    return IO.escapeRegExp(str);
  }

  /**
   * Register a plugin method to the IO prototype
   * @param {string} name - Plugin method name
   * @param {Function} callback - Plugin callback function
   * @returns {void}
   */
  static plugin(name, callback) {
    if (typeof name !== 'string') {
      IO.#warn('Plugin name must be string');

      return;
    }

    if (typeof callback !== 'function') {
      IO.#warn('Plugin callback must be function');

      return;
    }

    if (Object.hasOwn(IO.prototype, name)) {
      IO.#warn(`Plugin "${name}" already exists`);

      return;
    }

    IO.prototype[name] = callback;
  }

  /*** Private Methods ***/

  /**
   * Log a warning when IO.debug is enabled
   * @param {...*} args - Values to log
   */
  static #warn(...args) {
    if (IO.debug) {
      console.warn(...args);
    }
  }

  /**
   * Convert a data attribute name to its dataset key ("selected-label" -> "selectedLabel")
   * @param {string} name - Attribute name without the "data-" prefix
   * @returns {string}
   */
  static #dataKey(name) {
    return name.includes('-') ? name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) : name;
  }

  /**
   * Check that a URL attribute value uses an allowed scheme (relative URLs are allowed)
   * @param {string} value - Raw attribute value
   * @param {string[]} schemes - Allowed schemes, lowercase
   * @returns {boolean}
   */
  static #isSafeUrl(value, schemes) {
    // Browsers ignore whitespace and control characters inside the scheme ("java\tscript:").
    const normalized = value.replace(/[\u0000-\u0020\u007F-\u009F]/g, '').toLowerCase();
    const match = normalized.match(/^([a-z][a-z0-9+.-]*):/);

    return !match || schemes.includes(match[1]);
  }

  /**
   * Check whether an element exposes a "value" property
   * @param {Element} el
   * @returns {boolean}
   */
  static #hasValue(el) {
    return IO.#VALUE_ELEMENTS.includes(el.tagName);
  }

  /**
   * First element matching a selector inside the collection (stops at the first match)
   * @param {string} selector
   * @returns {IO}
   */
  #first(selector) {
    for (const el of this.elements) {
      const found = el.querySelector(selector);

      if (found) {
        return new IO(found);
      }
    }

    return new IO([]);
  }

  /**
   * All elements matching a selector inside the collection, without duplicates
   * @param {string} selector
   * @returns {IO}
   */
  #all(selector) {
    const found = new Set();

    for (const el of this.elements) {
      el.querySelectorAll(selector).forEach(node => found.add(node));
    }

    return new IO([...found]);
  }

  /**
   * Set one inline style property (single write, with or without !important)
   * @param {HTMLElement} el
   * @param {string} key - Property name, camelCase, kebab-case or custom property
   * @param {string} value
   * @param {boolean} important
   */
  #setStyle(el, key, value, important) {
    if (key.startsWith('--')) {
      el.style.setProperty(key, value, important ? 'important' : '');

      return;
    }

    const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    if (!(camelKey in el.style)) {
      IO.#warn(`css: Invalid style property "${key}"`);

      return;
    }

    if (important) {
      const kebabKey = camelKey.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      el.style.setProperty(kebabKey, value, 'important');
    } else {
      el.style[camelKey] = value;
    }
  }

  /**
   * Normalizes class names into an array.
   *
   * @param {string|string[]} classes
   * @returns {string[]}
   */
  #normalizeClasses(classes) {
    if (typeof classes === 'string') {
      return classes.trim().split(/\s+/).filter(Boolean);
    }

    if (Array.isArray(classes)) {
      return classes
        .filter(cls => typeof cls === 'string')
        .flatMap(cls => cls.trim().split(/\s+/))
        .filter(Boolean)
      ;
    }

    return [];
  }
}

/**
 * Shortcut function to create an IO instance
 * @param {string|Element|NodeList|Array|Document} selector - The selector, element, NodeList, array of elements, or document
 * @param {Document|Element} [context=document] - The context for querying elements
 * @returns {IO} A new IO instance
 */
const $io = (selector, context) => new IO(selector, context);
