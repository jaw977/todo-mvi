## Dependencies: Rx, _(lodash), PouchDB, util, intent
## Exports: model

_toView = {} #status: [0,1]
_todos = {}
_db = new PouchDB 'todo-mvi'
_nextOrder = 0

_putTodo = (todo) ->
  _db.put todo, (err, result) ->
    throw err if err
    todo._rev = result.rev

_load$ = Rx.Observable.create (observer) ->
  _db.allDocs include_docs: true, (err, doc) ->
    for row in doc.rows
      _todos[row.id] = row.doc
      _nextOrder = row.doc.order if row.doc.order > _nextOrder
    _nextOrder++
    observer.onNext()

_create$ = intent.create$.map (name) ->
  todo =
    _id: new Date().toISOString()
    name: name
    order: _nextOrder++
    open: util.date.today()
  _todos[todo._id] = todo
  _putTodo todo

_star$ = intent.star$.map (id) ->
  todo = _todos[id]
  if not todo.close
    todo.status = if todo.status == 'star' then '' else 'star'
    _putTodo todo

_close$ = intent.close$.map (id) ->
  todo = _todos[id]
  todo.close = if todo.close then false else util.date.today()
  delete todo.status
  _putTodo todo

_delete$ = intent.delete$.map (id) ->
  todo = _todos[id]
  if todo.close
    todo.close = false
    delete todo.status
  else
    todo.close = util.date.today()
    todo.status = "delete"
  _putTodo todo

_editName$ = intent.editName$.map (id) -> _toView.idEditing = id

_updateName$ = intent.updateName$.map (name) ->
  todo = _todos[_toView.idEditing]
  if todo.name != name
    todo.name = name
    _putTodo todo
  _toView.idEditing = null

###
_search$ = intent.search$.map (status) ->
  _toView.status = if status.length
    status.split(',').map (s) -> +s

_purge$ = intent.purge$.map ->
  for id, todo of _todos
    continue unless _statusLabels[todo.status] == 'Deleted'
    _db.remove todo
    delete _todos[id]
###

_export$ = intent.export$.map -> _toView.showExport = not _toView.showExport

@model =
  
  exportTodo: (todo) ->
    closed = if todo.close then "x #{todo.close} " else ""
    status = if todo.status then "status:#{todo.status} " else ""
    "#{closed}#{todo.open} #{status}#{todo.name}"
    
  todos$:
    Rx.Observable.merge _create$, _star$, _close$, _delete$, _load$, _export$, _editName$, _updateName$
      .map ->
        _toView.todos = _.filter _todos, (todo) -> if _toView.status then _.contains _toView.status, todo.status else true
        _toView

util.init$.onNext "model"
