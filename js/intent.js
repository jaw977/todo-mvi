(function() {
  var intent, isEnterKey, stream, targetValue, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;

  intent = this.intent = {};

  targetValue = function(ev) {
    return ev.target.value;
  };

  isEnterKey = function(ev) {
    return ev.keyCode === 13;
  };

  _ref = ['search', 'sort', 'export$', 'config', 'project'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    stream = _ref[_i];
    intent[stream] = view[stream].map(targetValue);
  }

  intent.create = view.create.filter(isEnterKey).map(function(ev) {
    var name;
    name = ev.target.value;
    ev.target.value = '';
    return {
      name: name
    };
  }).filter(function(obj) {
    return obj.name.length;
  });

  _ref1 = ['editName', 'editOpen', 'editClose', 'star', 'close', 'delete$'];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    stream = _ref1[_j];
    intent[stream] = view[stream].map(function(ev) {
      var el;
      el = ev.target;
      while (el.tagName !== 'TR') {
        el = el.parentNode;
      }
      return el.id;
    });
  }

  _ref2 = ['updateName', 'searchName', 'couchdb'];
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    stream = _ref2[_k];
    intent[stream] = view[stream].filter(isEnterKey).map(targetValue);
  }

  _ref3 = ['updateOpen', 'updateClose', 'closeStart', 'closeEnd'];
  for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
    stream = _ref3[_l];
    intent[stream] = view[stream].map(function(date) {
      return util.date.format(date);
    });
  }

  intent.purge = view.purge.filter(function() {
    return confirm("This will permanently remove all displayed todos from the database!  Are you sure?");
  });

  intent.reset = view.reset.filter(function() {
    return confirm("This will reset (delete) the entire database and all todos!  Are you sure?");
  });

}).call(this);
