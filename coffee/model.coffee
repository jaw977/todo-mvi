## Dependencies: Rx, _(lodash), PouchDB, util, intent
## Exports: model

_toView = status: 'open'
_todos = {}
_visibleIds = []
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
  id = new Date().toISOString()
  todo =
    _id: id
    name: name
    order: _nextOrder++
    open: util.date.today()
  _todos[id] = todo
  _putTodo todo
  _visibleIds.push id

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

_editName$ = intent.editName$.map (id) -> ['name', id]
_editOpen$ = intent.editOpen$.map (id) -> ['open', id]
_edit$ = Rx.Observable.merge _editName$, _editOpen$
  .map ([field,id]) ->
    _toView.idEditing = id
    _toView.fieldEditing = field

_updateName$ = intent.updateName$.map (name) -> ['name',name]
_updateOpen$ = intent.updateOpen$.map (open) -> ['open',open]
_update$ = Rx.Observable.merge _updateName$, _updateOpen$
  .map ([field,value]) ->
    todo = _todos[_toView.idEditing]
    if todo[field] != value
      todo[field] = value
      _putTodo todo
    _toView.idEditing = null

_search$ = intent.search$
  .merge _load$
  .map (status) ->
    _toView.status = status = status or _toView.status
    _visibleIds = for id, todo of _todos
      continue if status == 'open' and todo.close
      continue if status == 'star' and todo.status != 'star'
      continue if status == 'close' and not todo.close
      id

###
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
    Rx.Observable.merge _create$, _star$, _close$, _delete$, _search$, _export$, _edit$, _update$
      .map ->
        _toView.todos = _visibleIds.map (id) -> _todos[id]
        _toView

util.init$.onNext "model"
