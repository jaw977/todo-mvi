(function() {
  var _close$, _create$, _db, _delete$, _editName$, _export$, _load$, _nextOrder, _putTodo, _search$, _star$, _toView, _todos, _updateName$, _visibleIds;

  _toView = {
    status: 'open'
  };

  _todos = {};

  _visibleIds = [];

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
    var id, todo;
    id = new Date().toISOString();
    todo = {
      _id: id,
      name: name,
      order: _nextOrder++,
      open: util.date.today()
    };
    _todos[id] = todo;
    _putTodo(todo);
    return _visibleIds.push(id);
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

  _search$ = intent.search$.merge(_load$).map(function(status) {
    var id, todo;
    _toView.status = status = status || _toView.status;
    return _visibleIds = (function() {
      var _results;
      _results = [];
      for (id in _todos) {
        todo = _todos[id];
        if (status === 'open' && todo.close) {
          continue;
        }
        if (status === 'star' && todo.status !== 'star') {
          continue;
        }
        if (status === 'close' && !todo.close) {
          continue;
        }
        _results.push(id);
      }
      return _results;
    })();
  });


  /*
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
    todos$: Rx.Observable.merge(_create$, _star$, _close$, _delete$, _search$, _export$, _editName$, _updateName$).map(function() {
      _toView.todos = _visibleIds.map(function(id) {
        return _todos[id];
      });
      return _toView;
    })
  };

  util.init$.onNext("model");

}).call(this);
