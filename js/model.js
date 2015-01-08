(function() {
  var close$, closeEnd$, closeStart$, config$, configDoc, couchdb$, create$, delete$, edit$, editClose$, editName$, editOpen$, export$, handleError, load$, pouchdb, purge$, putDoc, recurUnits, search$, searchName$, searchStatus$, sort$, star$, toView, todoModelMethods, todosObj, update$, updateClose$, updateName$, updateOpen$, visibleIds;

  toView = {
    status: 'open',
    sort: 'star,open,name'
  };

  todosObj = {};

  visibleIds = [];

  pouchdb = new PouchDB('todo-mvi');

  configDoc = {
    _id: 'config'
  };

  handleError = function(err) {
    alert("Error: " + err);
    throw err;
  };

  putDoc = function(doc) {
    pouchdb.put(_.clone(doc), function(err, result) {
      if (err) {
        throw err;
      }
      return doc._rev = result.rev;
    });
    if (configDoc.couchdb) {
      pouchdb.replicate.to(configDoc.couchdb);
    }
    return doc;
  };

  recurUnits = {
    d: 'days',
    w: 'weeks',
    m: 'months',
    y: 'years'
  };

  todoModelMethods = {
    put: function() {
      return putDoc(this);
    },
    recur: function() {
      var count, matches, name, open, unit;
      if (!this.close) {
        return;
      }
      name = this.name;
      matches = name.match(/\brecur:(\d+)([dwmy]\b)/);
      if (!matches) {
        return;
      }
      count = matches[1];
      unit = recurUnits[matches[2]];
      open = util.date.format(moment(this.close).add(count, unit));
      matches = name.match(/(.*?)\s*--/);
      if (matches) {
        name = matches[1];
      }
      return {
        name: name,
        open: open
      };
    },
    clone: function() {
      return _.clone(this);
    }
  };

  load$ = Rx.Observable.create(function(observer) {
    return pouchdb.allDocs({
      include_docs: true
    }, function(err, doc) {
      var row, _i, _len, _ref;
      _ref = doc.rows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        if (row.id === 'config') {
          configDoc = row.doc;
          toView.couchdb = configDoc.couchdb;
        } else {
          todosObj[row.id] = _.create(todoModelMethods, row.doc);
        }
      }
      observer.onNext();
      if (configDoc.couchdb) {
        return pouchdb.replicate.from(configDoc.couchdb).on('error', function() {
          return handleError;
        }).on('complete', function() {
          return pouchdb.allDocs({
            include_docs: true
          }, function(err, doc) {
            var _j, _len1, _ref1;
            _ref1 = doc.rows;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              row = _ref1[_j];
              if (row.id !== 'config') {
                todosObj[row.id] = _.create(todoModelMethods, row.doc);
              }
            }
            return observer.onNext();
          });
        });
      }
    });
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
      return todo.put();
    }
  });

  close$ = intent.close.map(function(id) {
    var todo;
    todo = todosObj[id];
    todo.close = todo.close ? false : util.date.format();
    delete todo.star;
    delete todo.deleted;
    return todo.put().recur();
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
    return todo.put().recur();
  });

  create$ = Rx.Observable.merge(intent.create, close$, delete$).map(function(obj) {
    var id, todo;
    if (!obj) {
      return;
    }
    id = new Date().toISOString();
    todo = _.create(todoModelMethods, {
      _id: id,
      open: util.date.format()
    });
    _.assign(todo, obj);
    todosObj[id] = todo;
    todo.put();
    return visibleIds.push(id);
  });

  editName$ = intent.editName.map(function(id) {
    return ['name', id];
  });

  editOpen$ = intent.editOpen.map(function(id) {
    return ['open', id];
  });

  editClose$ = intent.editClose.map(function(id) {
    return ['close', id];
  });

  edit$ = Rx.Observable.merge(editName$, editOpen$, editClose$).map(function(_arg) {
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

  updateClose$ = intent.updateClose.map(function(close) {
    return ['close', close];
  });

  update$ = Rx.Observable.merge(updateName$, updateOpen$, updateClose$).map(function(_arg) {
    var field, todo, value;
    field = _arg[0], value = _arg[1];
    todo = todosObj[toView.idEditing];
    if (todo[field] !== value) {
      todo[field] = value;
      todo.put();
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

  config$ = intent.config.map(function() {
    return toView.showConfig = !toView.showConfig;
  });

  couchdb$ = intent.couchdb.subscribe(function(server) {
    if (server === configDoc.couchdb) {
      return;
    }
    configDoc.couchdb = toView.couchdb = server;
    putDoc(configDoc);
    if (server) {
      return pouchdb.sync(server);
    }
  });

  this.model = {
    exportTodo: function(todo) {
      var closed, priority, status;
      closed = todo.close ? "x " + todo.close + " " : "";
      status = todo.deleted ? "status:delete " : "";
      priority = todo.star ? "(A) " : "";
      return "" + closed + priority + todo.open + " " + status + todo.name;
    },
    todos$: Rx.Observable.merge(create$, star$, search$, export$, edit$, update$, purge$, config$).map(function() {
      toView.todos = visibleIds.map(function(id) {
        return todosObj[id].clone();
      });
      return toView;
    })
  };

}).call(this);
