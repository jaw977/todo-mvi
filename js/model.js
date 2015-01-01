(function() {
  var close$, create$, delete$, edit$, editName$, editOpen$, export$, load$, pouchdb, putTodo, search$, sort$, star$, toView, todosObj, update$, updateName$, updateOpen$, visibleIds;

  toView = {
    status: 'open',
    sort: 'star,open,name'
  };

  todosObj = {};

  visibleIds = [];

  pouchdb = new PouchDB('todo-mvi');

  putTodo = function(todo) {
    return pouchdb.put(todo, function(err, result) {
      if (err) {
        throw err;
      }
      return todo._rev = result.rev;
    });
  };

  load$ = Rx.Observable.create(function(observer) {
    return pouchdb.allDocs({
      include_docs: true
    }, function(err, doc) {
      var row, _i, _len, _ref;
      _ref = doc.rows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        todosObj[row.id] = row.doc;
      }
      return observer.onNext();
    });
  });

  create$ = intent.create.map(function(name) {
    var id, todo;
    id = new Date().toISOString();
    todo = {
      _id: id,
      name: name,
      open: util.date.format()
    };
    todosObj[id] = todo;
    putTodo(todo);
    return visibleIds.push(id);
  });

  star$ = intent.star.map(function(id) {
    var todo;
    todo = todosObj[id];
    if (!todo.close) {
      if (todo.star) {
        delete todo.star;
      } else {
        todo.star = true;
      }
      return putTodo(todo);
    }
  });

  close$ = intent.close.map(function(id) {
    var todo;
    todo = todosObj[id];
    todo.close = todo.close ? false : util.date.format();
    delete todo.star;
    delete todo.deleted;
    return putTodo(todo);
  });

  delete$ = intent.delete$.map(function(id) {
    var todo;
    todo = todosObj[id];
    if (todo.close) {
      todo.close = false;
      delete todo.star;
      delete todo.deleted;
    } else {
      todo.close = util.date.format();
      todo.deleted = true;
    }
    return putTodo(todo);
  });

  editName$ = intent.editName.map(function(id) {
    return ['name', id];
  });

  editOpen$ = intent.editOpen.map(function(id) {
    return ['open', id];
  });

  edit$ = Rx.Observable.merge(editName$, editOpen$).map(function(_arg) {
    var field, id;
    field = _arg[0], id = _arg[1];
    toView.idEditing = id;
    return toView.fieldEditing = field;
  });

  updateName$ = intent.updateName.map(function(name) {
    return ['name', name];
  });

  updateOpen$ = intent.updateOpen.map(function(open) {
    return ['open', open];
  });

  update$ = Rx.Observable.merge(updateName$, updateOpen$).map(function(_arg) {
    var field, todo, value;
    field = _arg[0], value = _arg[1];
    todo = todosObj[toView.idEditing];
    if (todo[field] !== value) {
      todo[field] = value;
      putTodo(todo);
    }
    return toView.idEditing = null;
  });

  sort$ = intent.sort.map(function(sort) {
    if (sort) {
      toView.sort = sort;
    }
    return null;
  });

  search$ = Rx.Observable.merge(intent.search, load$, sort$).map(function(status) {
    var id, todo, todos;
    toView.status = status = status || toView.status;
    todos = (function() {
      var _results;
      _results = [];
      for (id in todosObj) {
        todo = todosObj[id];
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
    todos = _.sortBy(todos, toView.sort.split(','));
    return visibleIds = _.map(todos, '_id');
  });

  export$ = intent.export$.map(function() {
    return toView.showExport = !toView.showExport;
  });

  this.model = {
    exportTodo: function(todo) {
      var closed, priority, status;
      closed = todo.close ? "x " + todo.close + " " : "";
      status = todo.deleted ? "status:delete " : "";
      priority = todo.star ? "(A) " : "";
      return "" + closed + priority + todo.open + " " + status + todo.name;
    },
    todos$: Rx.Observable.merge(create$, star$, close$, delete$, search$, export$, edit$, update$).map(function() {
      toView.todos = visibleIds.map(function(id) {
        return todosObj[id];
      });
      return toView;
    })
  };

}).call(this);
