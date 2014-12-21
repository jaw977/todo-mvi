(function() {
  var _close$, _create$, _db, _delete$, _editName$, _export$, _load$, _nextOrder, _putTodo, _star$, _toView, _todos, _updateName$;

  _toView = {};

  _todos = {};

  _db = new PouchDB('todo-mvi');

  _nextOrder = 0;

  _putTodo = function(todo) {
    return _db.put(todo, function(err, result) {
      if (err) {
        throw err;
      }
      return todo._rev = result.rev;
    });
  };

  _load$ = Rx.Observable.create(function(observer) {
    return _db.allDocs({
      include_docs: true
    }, function(err, doc) {
      var row, _i, _len, _ref;
      _ref = doc.rows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        _todos[row.id] = row.doc;
        if (row.doc.order > _nextOrder) {
          _nextOrder = row.doc.order;
        }
      }
      _nextOrder++;
      return observer.onNext();
    });
  });

  _create$ = intent.create$.map(function(name) {
    var todo;
    todo = {
      _id: new Date().toISOString(),
      name: name,
      order: _nextOrder++,
      open: util.date.today()
    };
    _todos[todo._id] = todo;
    return _putTodo(todo);
  });

  _star$ = intent.star$.map(function(id) {
    var todo;
    todo = _todos[id];
    if (!todo.close) {
      todo.status = todo.status === 'star' ? '' : 'star';
      return _putTodo(todo);
    }
  });

  _close$ = intent.close$.map(function(id) {
    var todo;
    todo = _todos[id];
    todo.close = todo.close ? false : util.date.today();
    delete todo.status;
    return _putTodo(todo);
  });

  _delete$ = intent.delete$.map(function(id) {
    var todo;
    todo = _todos[id];
    if (todo.close) {
      todo.close = false;
      delete todo.status;
    } else {
      todo.close = util.date.today();
      todo.status = "delete";
    }
    return _putTodo(todo);
  });

  _editName$ = intent.editName$.map(function(id) {
    return _toView.idEditing = id;
  });

  _updateName$ = intent.updateName$.map(function(name) {
    var todo;
    todo = _todos[_toView.idEditing];
    if (todo.name !== name) {
      todo.name = name;
      _putTodo(todo);
    }
    return _toView.idEditing = null;
  });


  /*
  _search$ = intent.search$.map (status) ->
    _toView.status = if status.length
      status.split(',').map (s) -> +s
  
  _purge$ = intent.purge$.map ->
    for id, todo of _todos
      continue unless _statusLabels[todo.status] == 'Deleted'
      _db.remove todo
      delete _todos[id]
   */

  _export$ = intent.export$.map(function() {
    return _toView.showExport = !_toView.showExport;
  });

  this.model = {
    exportTodo: function(todo) {
      var closed, status;
      closed = todo.close ? "x " + todo.close + " " : "";
      status = todo.status ? "status:" + todo.status + " " : "";
      return "" + closed + todo.open + " " + status + todo.name;
    },
    todos$: Rx.Observable.merge(_create$, _star$, _close$, _delete$, _load$, _export$, _editName$, _updateName$).map(function() {
      _toView.todos = _.filter(_todos, function(todo) {
        if (_toView.status) {
          return _.contains(_toView.status, todo.status);
        } else {
          return true;
        }
      });
      return _toView;
    })
  };

  util.init$.onNext("model");

}).call(this);
