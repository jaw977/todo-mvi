(function() {
  var stream, streamNames, view, _i, _len;

  view = this.view = {};

  streamNames = ['create', 'star', 'close', 'delete$', 'editName', 'editOpen', 'updateName', 'updateOpen', 'search', 'export$', 'sort'];

  for (_i = 0, _len = streamNames.length; _i < _len; _i++) {
    stream = streamNames[_i];
    view[stream] = new Rx.Subject();
  }

}).call(this);
