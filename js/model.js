(function() {
  var close$, closeEnd$, closeStart$, create$, delete$, edit$, editName$, editOpen$, export$, load$, pouchdb, purge$, putTodo, search$, searchName$, searchStatus$, sort$, star$, toView, todosObj, update$, updateName$, updateOpen$, visibleIds;

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

  purge$ = intent.purge.map(function() {
    var id, _i, _len;
    for (_i = 0, _len = visibleIds.length; _i < _len; _i++) {
      id = visibleIds[_i];
      pouchdb.remove(todosObj[id]);
      delete todosObj[id];
    }
    return visibleIds = [];
  });

  sort$ = intent.sort.map(function(sort) {
    if (sort) {
      return toView.sort = sort;
    }
  });

  searchStatus$ = intent.search.map(function(status) {
    if (status) {
      return toView.status = status;
    }
  });

  searchName$ = intent.searchName.map(function(name) {
    return toView.name = name;
  });

  closeStart$ = intent.closeStart.map(function(date) {
    return toView.closeStart = date;
  });

  closeEnd$ = intent.closeEnd.map(function(date) {
    return toView.closeEnd = date;
  });

  search$ = Rx.Observable.merge(load$, sort$, searchStatus$, searchName$, closeStart$, closeEnd$).map(function() {
    var id, todo, todos;
    todos = (function() {
      var _results;
      _results = [];
      for (id in todosObj) {
        todo = todosObj[id];
        if (toView.status === 'open' && todo.close) {
          continue;
        }
        if (toView.status === 'star' && !todo.star) {
          continue;
        }
        if (toView.status === 'close' && !todo.close) {
          continue;
        }
        if (toView.name && todo.name.indexOf(toView.name) === -1) {
          continue;
        }
        if (toView.closeStart && todo.close < toView.closeStart) {
          continue;
        }
        if (toView.closeEnd && todo.close > toView.closeEnd) {
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
    todos$: Rx.Observable.merge(create$, star$, close$, delete$, search$, export$, edit$, update$, purge$).map(function() {
      toView.todos = visibleIds.map(function(id) {
        return todosObj[id];
      });
      return toView;
    })
  };

}).call(this);
