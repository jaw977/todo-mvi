(function() {
  var intent, isEnterKey, stream, targetValue, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;

  intent = this.intent = {};

  targetValue = function(ev) {
    return ev.target.value;
  };

  isEnterKey = function(ev) {
    return ev.keyCode === 13;
  };

  _ref = ['search', 'sort', 'export$'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    stream = _ref[_i];
    intent[stream] = view[stream].map(targetValue);
  }

  intent.create = view.create.filter(isEnterKey).map(function(ev) {
    var name;
    name = ev.target.value;
    ev.target.value = '';
    return name;
  }).filter(function(name) {
    return name.length;
  });

  _ref1 = ['star', 'close', 'delete$'];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    stream = _ref1[_j];
    intent[stream] = view[stream].map(function(ev) {
      return ev.target.parentNode.parentNode.id;
    });
  }

  _ref2 = ['editName', 'editOpen'];
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    stream = _ref2[_k];
    intent[stream] = view[stream].map(function(ev) {
      return ev.target.parentNode.id;
    });
  }

  _ref3 = ['updateName', 'searchName'];
  for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
    stream = _ref3[_l];
    intent[stream] = view[stream].filter(isEnterKey).map(targetValue);
  }

  intent.updateOpen = view.updateOpen.map(function(date) {
    return util.date.format(date);
  });

}).call(this);
