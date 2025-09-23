QUnit.test('IO.js basic functionality', assert => {
  $io('#test-element').addClass('active');
  assert.ok($io('#test-element').hasClass('active'), 'Class added successfully');
  $io('#test-element').hide();
  assert.equal($io('#test-element').css('display'), 'none', 'Element hidden');
});
