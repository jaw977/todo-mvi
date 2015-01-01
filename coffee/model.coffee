## Dependencies: Rx, _(lodash), PouchDB, util, intent
## Exports: model

toView = status: 'open', sort:'star,open,name'
todosObj = {}
visibleIds = []
pouchdb = new PouchDB 'todo-mvi'

putTodo = (todo) ->
  pouchdb.put todo, (err, result) ->
    throw err if err
    todo._rev = result.rev

load$ = Rx.Observable.create (observer) ->
  pouchdb.allDocs include_docs: true, (err, doc) ->
    for row in doc.rows
      todosObj[row.id] = row.doc
    observer.onNext()

create$ = intent.create.map (name) ->
  id = new Date().toISOString()
  todo =
    _id: id
    name: name
    open: util.date.format()
  todosObj[id] = todo
  putTodo todo
  visibleIds.push id

star$ = intent.star.map (id) ->
  todo = todosObj[id]
  if not todo.close
    if todo.star
      delete todo.star
    else
      todo.star = true
    putTodo todo

close$ = intent.close.map (id) ->
  todo = todosObj[id]
  todo.close = if todo.close then false else util.date.format()
  delete todo.star
  delete todo.deleted
  putTodo todo

delete$ = intent.delete$.map (id) ->
  todo = todosObj[id]
  if todo.close
    todo.close = false
    delete todo.star
    delete todo.deleted
  else
    todo.close = util.date.format()
    todo.deleted = true
  putTodo todo

editName$ = intent.editName.map (id) -> ['name', id]
editOpen$ = intent.editOpen.map (id) -> ['open', id]
edit$ = Rx.Observable.merge editName$, editOpen$
  .map ([field,id]) ->
    toView.idEditing = id
    toView.fieldEditing = field

updateName$ = intent.updateName.map (name) -> ['name',name]
updateOpen$ = intent.updateOpen.map (open) -> ['open',open]
update$ = Rx.Observable.merge updateName$, updateOpen$
  .map ([field,value]) ->
    todo = todosObj[toView.idEditing]
    if todo[field] != value
      todo[field] = value
      putTodo todo
    toView.idEditing = null

sort$ = intent.sort.map (sort) ->
  toView.sort = sort if sort
  null

search$ = Rx.Observable.merge intent.search, load$, sort$
  .map (status) ->
    toView.status = status = status or toView.status
    todos = for id, todo of todosObj
      continue if status == 'open' and todo.close
      continue if status == 'star' and not todo.star
      continue if status == 'close' and not todo.close
      todo
    todos = _.sortBy todos, toView.sort.split ','
    visibleIds = _.map todos, '_id'

export$ = intent.export$.map -> toView.showExport = not toView.showExport

@model =
  
  exportTodo: (todo) ->
    closed = if todo.close then "x #{todo.close} " else ""
    status = if todo.deleted then "status:delete " else ""
    priority = if todo.star then "(A) " else ""
    "#{closed}#{priority}#{todo.open} #{status}#{todo.name}"
    
  todos$:
    Rx.Observable.merge create$, star$, close$, delete$, search$, export$, edit$, update$
      .map ->
        toView.todos = visibleIds.map (id) -> todosObj[id]
        toView
