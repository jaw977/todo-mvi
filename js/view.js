(function() {
  var stream, streamNames, view, _i, _len;

  view = this.view = {};

  streamNames = ['create', 'star', 'close', 'delete$', 'editName', 'editOpen', 'editClose', 'updateName', 'updateOpen', 'updateClose', 'search', 'searchName', 'export$', 'sort', 'closeStart', 'closeEnd', 'purge', 'config', 'couchdb', 'project', 'reset'];

  for (_i = 0, _len = streamNames.length; _i < _len; _i++) {
    stream = streamNames[_i];
    view[stream] = new Rx.Subject();
  }

}).call(this);
