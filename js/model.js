(function() {
  var _close$, _create$, _db, _delete$, _edit$, _editName$, _editOpen$, _export$, _load$, _nextOrder, _putTodo, _search$, _sort$, _star$, _toView, _todos, _update$, _updateName$, _updateOpen$, _visibleIds;

  _toView = {
    status: 'open',
    sort: 'star,open,name'
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
      todo.star = !todo.star;
      return _putTodo(todo);
    }
  });

  _close$ = intent.close$.map(function(id) {
    var todo;
    todo = _todos[id];
    todo.close = todo.close ? false : util.date.today();
    delete todo.star;
    delete todo.deleted;
    return _putTodo(todo);
  });

  _delete$ = intent.delete$.map(function(id) {
    var todo;
    todo = _todos[id];
    if (todo.close) {
      todo.close = false;
      delete todo.star;
      delete todo.deleted;
    } else {
      todo.close = util.date.today();
      todo.deleted = true;
    }
    return _putTodo(todo);
  });

  _editName$ = intent.editName$.map(function(id) {
    return ['name', id];
  });

  _editOpen$ = intent.editOpen$.map(function(id) {
    return ['open', id];
  });

  _edit$ = Rx.Observable.merge(_editName$, _editOpen$).map(function(_arg) {
    var field, id;
    field = _arg[0], id = _arg[1];
    _toView.idEditing = id;
    return _toView.fieldEditing = field;
  });

  _updateName$ = intent.updateName$.map(function(name) {
    return ['name', name];
  });

  _updateOpen$ = intent.updateOpen$.map(function(open) {
    return ['open', open];
  });

  _update$ = Rx.Observable.merge(_updateName$, _updateOpen$).map(function(_arg) {
    var field, todo, value;
    field = _arg[0], value = _arg[1];
    todo = _todos[_toView.idEditing];
    if (todo[field] !== value) {
      todo[field] = value;
      _putTodo(todo);
    }
    return _toView.idEditing = null;
  });

  _sort$ = intent.sort$.map(function(sort) {
    if (sort) {
      _toView.sort = sort;
    }
    return null;
  });

  _search$ = Rx.Observable.merge(intent.search$, _load$, _sort$).map(function(status) {
    var id, todo, todos;
    _toView.status = status = status || _toView.status;
    todos = (function() {
      var _results;
      _results = [];
      for (id in _todos) {
        todo = _todos[id];
        if (status === 'open' && todo.close) {
          continue;
        }
        if (status === 'star' && !todo.star) {
          continue;
        }
        if (status === 'close' && !todo.close) {
          continue;
        }
        _results.push(todo);
      }
      return _results;
    })();
    todos = _.sortBy(todos, _toView.sort.split(','));
    return _visibleIds = _.map(todos, '_id');
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
      var closed, priority, status;
      closed = todo.close ? "x " + todo.close + " " : "";
      status = todo.deleted ? "status:delete " : "";
      priority = todo.star ? "(A) " : "";
      return "" + closed + priority + todo.open + " " + status + todo.name;
    },
    todos$: Rx.Observable.merge(_create$, _star$, _close$, _delete$, _search$, _export$, _edit$, _update$).map(function() {
      _toView.todos = _visibleIds.map(function(id) {
        return _todos[id];
      });
      return _toView;
    })
  };

  util.init$.onNext("model");

}).call(this);
