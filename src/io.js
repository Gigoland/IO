/**
 * IO - Modern lightweight DOM utility library
 * Version: 1.0.4
 * Author: Gigoland.com
 * License: MIT License
 * Repository: https://github.com/Gigoland/IO
 * Description: Lightweight utility for DOM manipulation, events, attributes, CSS, and HTML handling. Users are responsible for sanitizing HTML input using sanitizeXSS manually.
 */
class IO {
  /**
   * Initialize elements based on selector type
   * @param {string|Element|NodeList|Array|Document} selector - The selector, element, NodeList, array of elements, or document
   * @param {Document|Element} [context=document] - The context for querying elements
   */
  constructor(selector, context = document) {
    if (typeof selector === 'string') {
      selector = selector.trim();
      if (selector === 'body') {
        if (!(context instanceof Document) || !context.body) {
          console.warn('IO: Invalid context or document.body not available');
          this.elements = [];
        } else {
          this.elements = [context.body];
        }
      } else if (/^#[^\s][\S]*$/.test(selector)) {
        const id = selector.slice(1);
        const element = context.getElementById && !(context instanceof DocumentFragment) ? context.getElementById(id) : context.querySelector(`#${CSS.escape(id)}`);
        if (element) {
          this.elements = [element];
        } else {
          this.elements = [];
        }
      } else {
        this.elements = Array.from(context.querySelectorAll(selector));
        if (this.elements.length === 0 && selector !== '') {
          console.warn(`IO: No elements found for selector "${selector}"`);
        }
      }
    } else if (selector instanceof Element) {
      this.elements = [selector];
    } else if (selector instanceof Document) {
      if (!selector.body) {
        console.warn('IO: document.body is not available');
        this.elements = [];
      } else {
        this.elements = [selector.body];
      }
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
      this.elements = Array.from(selector).filter(el => el instanceof Element);
    } else {
      this.elements = [];
      console.warn('IO: Invalid selector type');
    }
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
      console.warn('native: Index must be an integer');
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
   * Show all elements by resetting display or setting to block
   * @param {boolean} [isEmpty=false] - Whether to reset display to empty string or use stored/dataset value
   * @returns {IO} The IO instance for chaining
   */
  show(isEmpty = false) {
    return this.forEach(el => el.style.display = isEmpty ? '' : (el.dataset.ioDisplay || 'block'));
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
      const isVisible = getComputedStyle(el).display !== 'none';
      const instance = new IO(el);
      if (isVisible) {
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
      el.style.pointerEvents = 'auto';
      el.classList.remove('disabled', 'opacity-25');
    });
  }

  /**
   * Disable all elements by adding disabled state and styles
   * @returns {IO} The IO instance for chaining
   */
  disable() {
    return this.forEach(el => {
      if ('disabled' in el) {
        el.disabled = true;
      }
      el.style.pointerEvents = 'none';
      el.classList.add('disabled', 'opacity-25');
    });
  }

  /*** Class Methods ***/

  /**
   * Add one or more classes to all elements
   * @param {...string} classes - The classes to add
   * @returns {IO} The IO instance for chaining
   */
  addClass(...classes) {
    if (!classes.length || classes.some(cls => !cls || typeof cls !== 'string' || !cls.trim())) {
      console.warn('addClass: Invalid class name(s)');
      return this;
    }
    const classList = classes.flatMap(cls => cls.trim().split(/\s+/));
    this.elements.forEach(el => el.classList.add(...classList));
    return this;
  }

  /**
   * Remove one or more classes from all elements
   * @param {...string} classes - The classes to remove
   * @returns {IO} The IO instance for chaining
   */
  removeClass(...classes) {
    if (!classes.length || classes.some(cls => !cls || typeof cls !== 'string' || !cls.trim())) {
      console.warn('removeClass: Invalid class name(s)');
      return this;
    }
    const classList = classes.flatMap(cls => cls.trim().split(/\s+/));
    this.elements.forEach(el => el.classList.remove(...classList));
    return this;
  }

  /**
   * Toggle one or more classes on all elements
   * @param {...string} classes - The classes to toggle
   * @returns {IO} The IO instance for chaining
   */
  toggleClass(...classes) {
    if (!classes.length || classes.some(cls => !cls || typeof cls !== 'string' || !cls.trim())) {
      console.warn('toggleClass: Invalid class name(s)');
      return this;
    }
    const classList = classes.flatMap(cls => cls.trim().split(/\s+/));
    this.elements.forEach(el => {
      classList.forEach(className => el.classList.toggle(className));
    });
    return this;
  }

  /**
   * Check if the first element has all specified classes
   * @param {...string} classes - The classes to check
   * @returns {boolean} True if the first element has all classes, false otherwise
   */
  hasClass(...classes) {
    if (!classes.length || classes.some(cls => !cls || typeof cls !== 'string' || !cls.trim())) {
      console.warn('hasClass: Invalid class name(s)');
      return false;
    }
    if (this.elements[0]) {
      return classes.every(cls => this.elements[0].classList.contains(cls.trim()));
    }
    return false;
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
      console.warn('text: Invalid value, expected string or number');
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
      console.warn('html: Invalid value, expected string or number');
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
      console.warn('htmlAdd: Invalid value, expected string or number');
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
      console.warn('htmlSub: Invalid value, expected string or number');
      return this;
    }
    return this.forEach(el => {
      const currentText = el.textContent.trim();
      if (typeof val === 'number' && !isNaN(parseFloat(currentText)) && Number.isFinite(parseFloat(currentText))) {
        el.innerHTML = (parseFloat(currentText) - val).toString();
      } else {
        el.innerHTML = el.innerHTML.replace(new RegExp(this.escapeRegExp(String(val)), 'g'), '');
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
      console.warn('htmlAppend: IO instance has no elements');
      return this;
    }
    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('beforeend', val.trim());
      } else if (val instanceof HTMLElement) {
        const nodeToAppend = i < this.elements.length - 1 ? val.cloneNode(true) : val;
        el.appendChild(nodeToAppend);
      } else if (val instanceof IO) {
        val.elements.forEach((child, j) => {
          const shouldClone = !(i === this.elements.length - 1 && j === val.elements.length - 1);
          el.appendChild(shouldClone ? child.cloneNode(true) : child);
        });
      } else {
        console.warn('htmlAppend: Invalid value', val);
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
      console.warn('htmlPrepend: IO instance has no elements');
      return this;
    }
    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('afterbegin', val.trim());
      } else if (val instanceof HTMLElement) {
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
        console.warn('htmlPrepend: Invalid value', val);
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
      console.warn('htmlBefore: IO instance has no elements');
      return this;
    }
    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('beforebegin', val.trim());
      } else if (val instanceof HTMLElement) {
        const nodeToInsert = i < this.elements.length - 1 ? val.cloneNode(true) : val;
        el.parentNode.insertBefore(nodeToInsert, el);
      } else if (val instanceof IO) {
        val.elements.forEach((child, j) => {
          const shouldClone = !(i === this.elements.length - 1 && j === val.elements.length - 1);
          el.parentNode.insertBefore(shouldClone ? child.cloneNode(true) : child, el);
        });
      } else {
        console.warn('htmlBefore: Invalid value', val);
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
      console.warn('htmlAfter: IO instance has no elements');
      return this;
    }
    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('afterend', val.trim());
      } else if (val instanceof HTMLElement) {
        const nodeToInsert = i < this.elements.length - 1 ? val.cloneNode(true) : val;
        el.parentNode.insertBefore(nodeToInsert, el.nextSibling);
      } else if (val instanceof IO) {
        // Reverse for maintaining order when inserting after
        Array.from(val.elements).reverse().forEach((child, j) => {
          const shouldClone = !(i === this.elements.length - 1 && j === val.elements.length - 1);
          el.parentNode.insertBefore(shouldClone ? child.cloneNode(true) : child, el.nextSibling);
        });
      } else {
        console.warn('htmlAfter: Invalid value', val);
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
      console.warn('htmlReplace: IO instance has no elements');
      return this;
    }
    return this.forEach((el, i) => {
      if (typeof val === 'string') {
        el.insertAdjacentHTML('beforebegin', val.trim());
        el.remove();
      } else if (val instanceof HTMLElement) {
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
        console.warn('htmlReplace: Invalid value', val);
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
      console.warn('attr: Invalid attribute name');
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
      console.warn('removeAttr: Invalid attribute name');
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
      console.warn('aria: Invalid aria attribute');
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
      console.warn('data: Invalid data attribute name');
      if (value === undefined) {
        return null;
      }
      return this;
    }
    if (value === undefined) {
      if (this.elements[0]) {
        return this.elements[0].dataset[name];
      }
      return null;
    }
    return this.forEach(el => el.dataset[name] = value);
  }

  /**
   * Add a value to a data attribute (numeric or string concatenation)
   * @param {string} param - The data attribute name (without 'data-' prefix)
   * @param {string|number} val - The value to add
   * @returns {IO} The IO instance for chaining
   */
  dataAdd(param, val) {
    if (!param || typeof param !== 'string' || val === undefined) {
      console.warn('dataAdd: Invalid parameter or value');
      return this;
    }
    return this.forEach(el => {
      const current = el.dataset[param] || '';
      if (typeof val === 'number' && !isNaN(parseFloat(current)) && Number.isFinite(parseFloat(current))) {
        el.dataset[param] = (parseFloat(current) + val).toString();
      } else {
        el.dataset[param] = current + val;
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
      console.warn('dataSub: Invalid parameter or value');
      return this;
    }
    return this.forEach(el => {
      const current = el.dataset[param] || '';
      if (typeof val === 'number' && !isNaN(parseFloat(current)) && Number.isFinite(parseFloat(current))) {
        el.dataset[param] = (parseFloat(current) - val).toString();
      } else {
        el.dataset[param] = current.replace(new RegExp(this.escapeRegExp(String(val)), 'g'), '');
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
      if (this.elements[0] && (this.elements[0] instanceof HTMLInputElement || this.elements[0] instanceof HTMLSelectElement || this.elements[0] instanceof HTMLTextAreaElement)) {
        return this.elements[0].value;
      }
      return null;
    }
    return this.forEach(el => {
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
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
        return getComputedStyle(this.elements[0])[prop];
      }
      return null;
    }
    if (typeof prop !== 'string' && typeof prop !== 'object') {
      console.warn('css: Invalid property');
      return this;
    }
    return this.forEach(el => {
      if (typeof prop === 'object') {
        for (let key in prop) {
          if (key.startsWith('--')) {
            el.style.setProperty(key, prop[key], important ? 'important' : '');
          } else {
            const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            if (camelKey in el.style) {
              el.style[camelKey] = prop[key];
              if (important) {
                el.style.setProperty(key, prop[key], 'important');
              }
            } else {
              console.warn(`css: Invalid style property "${key}"`);
            }
          }
        }
      } else {
        if (prop.startsWith('--')) {
          el.style.setProperty(prop, value, important ? 'important' : '');
        } else {
          const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          if (camelProp in el.style) {
            el.style[camelProp] = value;
            if (important) {
              el.style.setProperty(prop, value, 'important');
            }
          } else {
            console.warn(`css: Invalid style property "${prop}"`);
          }
        }
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
      console.warn('on: Invalid event or handler');
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
      console.warn('off: Invalid event or handler');
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
      console.warn('delegate: Invalid event, selector, or handler');
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
      console.warn('undelegate: Invalid event or selector');
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
      console.warn('trigger: Invalid event type');
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
      console.warn('findBy: Invalid selector');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(target))).slice(0, 1));
  }

  /**
   * Find all elements by selector within elements
   * @param {string} target - The CSS selector
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllBy(target) {
    if (!target || typeof target !== 'string') {
      console.warn('findAllBy: Invalid selector');
      return new IO([]);
    }
    const results = [];
    for (const el of this.elements) {
      const found = el.querySelectorAll(target);
      for (let i = 0; i < found.length; i++) {
        results.push(found[i]);
      }
    }
    return new IO(results);
  }

  /**
   * Find the first element by ID within elements
   * @param {string} id - The ID to find
   * @returns {IO} A new IO instance with the first matching element
   */
  findById(id) {
    if (!id || typeof id !== 'string') {
      console.warn('findById: Invalid ID');
      return new IO([]);
    }
    const safeId = CSS.escape(id);
    return new IO(this.elements.flatMap(el => {
      const found = el.querySelector(`#${safeId}`);
      return found ? [found] : [];
    }).slice(0, 1));
  }

  /**
   * Find the first element by class within elements
   * @param {string} className - The class name to find
   * @returns {IO} A new IO instance with the first matching element
   */
  findByClass(className) {
    if (!className || typeof className !== 'string') {
      console.warn('findByClass: Invalid class name');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`.${className}`))).slice(0, 1));
  }

  /**
   * Find all elements by class within elements
   * @param {string} className - The class name to find
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllByClass(className) {
    if (!className || typeof className !== 'string') {
      console.warn('findAllByClass: Invalid class name');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`.${className}`))));
  }

  /**
   * Find the first element by name attribute within elements
   * @param {string} name - The name attribute to find
   * @returns {IO} A new IO instance with the first matching element
   */
  findByName(name) {
    if (!name || typeof name !== 'string') {
      console.warn('findByName: Invalid name');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`[name="${name}"]`))).slice(0, 1));
  }

  /**
   * Find all elements by name attribute within elements
   * @param {string} name - The name attribute to find
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllByName(name) {
    if (!name || typeof name !== 'string') {
      console.warn('findAllByName: Invalid name');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`[name="${name}"]`))));
  }

  /**
   * Find the first element by type attribute within elements
   * @param {string} type - The type attribute to find
   * @returns {IO} A new IO instance with the first matching element
   */
  findByType(type) {
    if (!type || typeof type !== 'string') {
      console.warn('findByType: Invalid type');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`[type="${type}"]`))).slice(0, 1));
  }

  /**
   * Find all elements by type attribute within elements
   * @param {string} type - The type attribute to find
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllByType(type) {
    if (!type || typeof type !== 'string') {
      console.warn('findAllByType: Invalid type');
      return new IO([]);
    }
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(`[type="${type}"]`))));
  }

  /**
   * Find the first element by attribute within elements
   * @param {string} attr - The attribute name
   * @param {string} [val] - The attribute value
   * @returns {IO} A new IO instance with the first matching element
   */
  findByAttr(attr, val) {
    if (!attr || typeof attr !== 'string') {
      console.warn('findByAttr: Invalid attribute');
      return new IO([]);
    }
    const selector = val !== undefined ? `[${attr}="${val}"]` : `[${attr}]`;
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(selector))).slice(0, 1));
  }

  /**
   * Find all elements by attribute within elements
   * @param {string} attr - The attribute name
   * @param {string} [val] - The attribute value
   * @returns {IO} A new IO instance with all matching elements
   */
  findAllByAttr(attr, val) {
    if (!attr || typeof attr !== 'string') {
      console.warn('findAllByAttr: Invalid attribute');
      return new IO([]);
    }
    const selector = val !== undefined ? `[${attr}="${val}"]` : `[${attr}]`;
    return new IO(this.elements.flatMap(el => Array.from(el.querySelectorAll(selector))));
  }

  /**
   * Find the closest parent by ID
   * @param {string} id - The ID to find
   * @returns {IO} A new IO instance with the closest matching parent
   */
  findParentById(id) {
    if (!id || typeof id !== 'string') {
      console.warn('findParentById: Invalid ID');
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
      console.warn('findParentByClass: Invalid class name');
      return new IO([]);
    }
    return new IO(this.elements.map(el => el.closest(`.${className}`)).filter(Boolean));
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
      console.warn('isEmptyData: Invalid parameter');
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
  escapeRegExp(str) {
    return str.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Sanitize an HTML string to prevent XSS
   * @param {string} str - The HTML string to sanitize
   * @param {Object} [options] - Sanitization options
   * @param {string[]} [options.allowedTags=['b', 'i', 'u', 'strong', 'em', 'p', 'div', 'span', 'a', 'br']] - Allowed HTML tags
   * @param {string[]} [options.allowedAttributes=['src', 'href', 'class', 'id']] - Allowed HTML attributes
   * @returns {string} The sanitized HTML string
   */
  sanitizeXSS(str, options = {
    allowedTags: ['b', 'i', 'u', 'strong', 'em', 'p', 'div', 'span', 'a', 'br'],
    allowedAttributes: ['src', 'href', 'class', 'id']
  }) {
    if (typeof str !== 'string') {
      console.warn('sanitizeXSS: Invalid input, expected string');
      return '';
    }
    const { allowedTags, allowedAttributes } = options;
    const temp = document.createElement('div');
    temp.innerHTML = str;
    const fragment = document.createDocumentFragment();
    fragment.append(...temp.childNodes);
    const sanitizeNode = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (!allowedTags.includes(tagName)) {
          node.replaceWith(...Array.from(node.childNodes).map(sanitizeNode));
        } else {
          Array.from(node.attributes).forEach(attr => {
            const attrName = attr.name.toLowerCase();
            if (!allowedAttributes.includes(attrName) ||
                (attrName === 'href' && /^(javascript|data):/i.test(attr.value)) ||
                attrName.startsWith('on') ||
                attrName === 'style') {
              node.removeAttribute(attr.name);
            }
          });
          Array.from(node.childNodes).forEach(sanitizeNode);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/(javascript|data):/gi, '');
      }
      return node;
    };
    Array.from(fragment.childNodes).forEach(sanitizeNode);
    return temp.innerHTML;
  }
}

/**
 * Shortcut function to create an IO instance
 * @param {string|Element|NodeList|Array|Document} selector - The selector, element, NodeList, array of elements, or document
 * @param {Document|Element} [context=document] - The context for querying elements
 * @returns {IO} A new IO instance
 */
const $io = (selector, context) => new IO(selector, context);
