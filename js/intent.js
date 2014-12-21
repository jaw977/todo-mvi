(function() {
  var intent, stream, _i, _j, _len, _len1, _ref, _ref1;

  intent = this.intent = {};

  _ref = ['star$', 'close$', 'delete$', 'search$'];
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

  intent.editName$ = view.editName$.map(function(ev) {
    return ev.target.parentNode.parentNode.id;
  });

  intent.updateName$ = view.updateName$.filter(function(ev) {
    return ev.key === 'Enter';
  }).map(function(ev) {
    return ev.target.value;
  });

}).call(this);
