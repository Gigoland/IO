QUnit.test('IO.js basic functionality', assert => {
  $io('#test-element').addClass('active');
  assert.ok($io('#test-element').hasClass('active'), 'Class added successfully');
  $io('#test-element').hide();
  assert.equal($io('#test-element').css('display'), 'none', 'Element hidden');
});

QUnit.test('sanitizeXSS parses in an inert template (no handler runs during parsing)', assert => {
  const done = assert.async();
  window.__ioXss = 0;
  const out = IO.sanitizeXSS('<img src="missing.png" onerror="window.__ioXss = 1"><b>ok</b>', { allowedTags: ['b'] });
  setTimeout(() => {
    assert.strictEqual(window.__ioXss, 0, 'onerror did not run');
    assert.strictEqual(out, '<b>ok</b>', 'img removed, allowed tag kept');
    done();
  }, 300);
});

QUnit.test('sanitizeXSS blocks dangerous URL schemes, even obfuscated', assert => {
  assert.strictEqual(IO.sanitizeXSS('<a href=" javascript:alert(1)">x</a>'), '<a>x</a>', 'leading space');
  assert.strictEqual(IO.sanitizeXSS('<a href="java&#9;script:alert(1)">x</a>'), '<a>x</a>', 'tab inside scheme');
  assert.strictEqual(IO.sanitizeXSS('<a href="vbscript:msgbox(1)">x</a>'), '<a>x</a>', 'vbscript');
  assert.strictEqual(IO.sanitizeXSS('<a href="https://example.com/a?b=c:d">x</a>'), '<a href="https://example.com/a?b=c:d">x</a>', 'https kept');
  assert.strictEqual(IO.sanitizeXSS('<a href="/page">x</a>'), '<a href="/page">x</a>', 'relative URL kept');
});

QUnit.test('sanitizeXSS drops script/style content and keeps plain text intact', assert => {
  assert.strictEqual(IO.sanitizeXSS('<p>ok</p><script>steal()</script><style>body{}</style>'), '<p>ok</p>');
  assert.strictEqual(IO.sanitizeXSS('<p>Format data: CSV</p>'), '<p>Format data: CSV</p>');
  assert.strictEqual(IO.sanitizeXSS('<p onclick="x()" style="color:red">t</p>'), '<p>t</p>');
});

QUnit.test('sanitizeXSS accepts partial options', assert => {
  assert.strictEqual(IO.sanitizeXSS('<b class="c">x</b><i>y</i>', { allowedTags: ['b'] }), '<b class="c">x</b>y');
});

QUnit.test('$io() without argument is an empty collection; README aliases work', assert => {
  assert.strictEqual($io().count(), 0);
  assert.strictEqual($io().sanitizeXSS('<b>x</b>'), '<b>x</b>');
  assert.strictEqual($io().escapeRegExp('a.b'), 'a\\.b');
});

QUnit.test('"#id.class" is a CSS selector, not an id', assert => {
  const el = document.createElement('div');
  el.id = 'io-sel-test';
  el.className = 'on';
  document.body.appendChild(el);
  assert.strictEqual($io('#io-sel-test.on').count(), 1);
  assert.strictEqual($io('#io-sel-test.off').count(), 0);
  el.remove();
});

QUnit.test('val() reads and writes buttons and options', assert => {
  const button = document.createElement('button');
  button.value = 'yes';
  assert.strictEqual($io(button).val(), 'yes');
  $io(button).val('no');
  assert.strictEqual(button.value, 'no');
});

QUnit.test('data() accepts kebab-case names', assert => {
  const el = document.createElement('div');
  $io(el).data('selected-label', 'x');
  assert.strictEqual(el.dataset.selectedLabel, 'x');
  assert.strictEqual($io(el).data('selected-label'), 'x');
  $io(el).data('count-value', 1).dataAdd('count-value', 2);
  assert.strictEqual($io(el).data('countValue'), '3');
});

QUnit.test('findAll* removes duplicates from nested collections; finders escape values', assert => {
  const root = document.createElement('div');
  root.innerHTML = '<div class="outer"><div class="inner"><span class="t">a</span></div></div><input name="a&quot;b">';
  document.body.appendChild(root);
  assert.strictEqual($io(root.querySelectorAll('div')).findAllBy('span').count(), 1, 'no duplicate');
  assert.strictEqual($io(root.querySelectorAll('div')).findBy('span').text(), 'a');
  assert.strictEqual($io(root).findByName('a"b').count(), 1, 'quote in name is escaped');
  root.remove();
});

QUnit.test('css() reads custom properties and writes !important once', assert => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  $io(el).css('--io-gap', '4px');
  assert.strictEqual($io(el).css('--io-gap'), '4px');
  $io(el).css('background-color', 'red', true);
  assert.strictEqual(el.style.getPropertyPriority('background-color'), 'important');
  el.remove();
});

QUnit.test('warnings are silent unless IO.debug is enabled', assert => {
  const original = console.warn;
  const messages = [];
  console.warn = (...args) => messages.push(args.join(' '));
  $io('.io-no-such-element');
  IO.debug = true;
  $io('.io-no-such-element');
  IO.debug = false;
  console.warn = original;
  assert.strictEqual(messages.length, 1);
});
