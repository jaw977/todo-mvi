(function() {
  var intent, stream, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4;

  intent = this.intent = {};

  _ref = ['close$', 'delete$', 'search$', 'sort$'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    stream = _ref[_i];
    intent[stream] = view[stream].map(function(ev) {
      return ev.target.value;
    });
  }

  _ref1 = ['purge$', 'export$'];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    stream = _ref1[_j];
    intent[stream] = view[stream];
  }

  intent.create$ = view.create$.map(function(ev) {
    var name;
    name = ev.target.value;
    ev.target.value = '';
    return name;
  }).filter(function(name) {
    return name.length;
  });

  _ref2 = ['star$', 'close$', 'delete$'];
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    stream = _ref2[_k];
    intent[stream] = view[stream].map(function(ev) {
      return ev.target.parentNode.parentNode.id;
    });
  }

  _ref3 = ['editName$', 'editOpen$'];
  for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
    stream = _ref3[_l];
    intent[stream] = view[stream].map(function(ev) {
      return ev.target.parentNode.id;
    });
  }

  _ref4 = ['updateName$'];
  for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
    stream = _ref4[_m];
    intent[stream] = view[stream].filter(function(ev) {
      return ev.key === 'Enter';
    }).map(function(ev) {
      return ev.target.value;
    });
  }

  intent.updateOpen$ = view.updateOpen$.map(function(date) {
    return util.date.format(date);
  });

}).call(this);
