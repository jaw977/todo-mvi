(function() {
  var _create$, _db, _editName$, _export$, _load$, _nextOrder, _purge$, _putTodo, _search$, _statusLabels, _toView, _todos, _updateName$, _updateStatus$;

  _toView = {
    status: [0, 1]
  };

  _todos = {};

  _statusLabels = ['Ready', 'Open', 'Closed', 'Deleted'];

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
      status: 0,
      order: _nextOrder++,
      open: util.date.today()
    };
    _todos[todo._id] = todo;
    return _putTodo(todo);
  });

  _updateStatus$ = intent.updateStatus$.map(function(id) {
    var statusLabel, todo;
    todo = _todos[id];
    todo.status = (todo.status + 1) % _statusLabels.length;
    statusLabel = _statusLabels[todo.status];
    if (statusLabel === 'Closed') {
      todo.close = util.date.today();
    } else if (statusLabel === 'Ready') {
      todo.close = false;
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

  _search$ = intent.search$.map(function(status) {
    return _toView.status = status.length ? status.split(',').map(function(s) {
      return +s;
    }) : void 0;
  });

  _purge$ = intent.purge$.map(function() {
    var id, todo, _results;
    _results = [];
    for (id in _todos) {
      todo = _todos[id];
      if (_statusLabels[todo.status] !== 'Deleted') {
        continue;
      }
      _db.remove(todo);
      _results.push(delete _todos[id]);
    }
    return _results;
  });

  _export$ = intent.export$.map(function() {
    return _toView.showExport = !_toView.showExport;
  });

  this.model = {
    statusLabels: _statusLabels.slice(0),
    exportTodo: function(todo) {
      var closed, status;
      closed = todo.close ? "x " + todo.close + " " : "";
      status = todo.status === 1 || todo.status === 3 ? "status:" + statusLabels[todo.status] + " " : "";
      return "" + closed + todo.open + " " + status + todo.name;
    },
    todos$: Rx.Observable.merge(_create$, _load$, _updateStatus$, _search$, _purge$, _export$, _editName$, _updateName$).map(function() {
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
