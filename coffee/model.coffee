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

purge$ = intent.purge.map ->
  for id in visibleIds
    pouchdb.remove todosObj[id]
    delete todosObj[id]
  visibleIds = []

sort$ = intent.sort.map (sort) -> toView.sort = sort if sort
searchStatus$ = intent.search.map (status) -> toView.status = status if status
searchName$ = intent.searchName.map (name) -> toView.name = name
closeStart$ = intent.closeStart.map (date) -> toView.closeStart = date
closeEnd$ = intent.closeEnd.map (date) -> toView.closeEnd = date
search$ = Rx.Observable.merge load$, sort$, searchStatus$, searchName$, closeStart$, closeEnd$
  .map ->
    todos = for id, todo of todosObj
      continue if toView.status == 'open' and todo.close
      continue if toView.status == 'star' and not todo.star
      continue if toView.status == 'close' and not todo.close
      continue if toView.name and todo.name.indexOf(toView.name) == -1
      continue if toView.closeStart and todo.close < toView.closeStart
      continue if toView.closeEnd and todo.close > toView.closeEnd
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
    Rx.Observable.merge create$, star$, close$, delete$, search$, export$, edit$, update$, purge$
      .map ->
        toView.todos = visibleIds.map (id) -> todosObj[id]
        toView
