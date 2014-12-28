(function() {
  var view;

  view = this.view = {};

  ['create$', 'star$', 'close$', 'delete$', 'editName$', 'editOpen$', 'updateName$', 'updateOpen$', 'search$', 'export$', 'sort$'].forEach(function(stream) {
    return view[stream] = new Rx.Subject();
  });

}).call(this);
