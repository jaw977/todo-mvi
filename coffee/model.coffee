## Dependencies: Rx, _(lodash), PouchDB, util, intent
## Exports: model

toView = status: 'open', sort:'star,open,name'
todosObj = {}
visibleIds = []
pouchdb = new PouchDB 'todo-mvi'
configDoc = _id: 'config'

handleError = (err) ->
  alert "Error: #{err}"
  throw err

putDoc = (doc) ->
  pouchdb.put _.clone(doc), (err, result) ->
    throw err if err
    doc._rev = result.rev
  doc

recurUnits =
  d: 'days'
  w: 'weeks'
  m: 'months'
  y: 'years'

todoModelMethods =

  put: -> putDoc @

  recur: ->
    return if not @close
    name = @name
    matches = name.match /\brecur:(\d+)([dwmy]\b)/
    return if not matches
    count = matches[1]
    unit = recurUnits[matches[2]]
    open = util.date.format moment(@close).add count, unit
    matches = name.match /(.*?)\s*--/
    name = matches[1] if matches
    name: name, open: open

  clone: -> _.clone @

load$ = Rx.Observable.create (observer) ->
  pouchdb.allDocs include_docs: true, (err, doc) ->
    for row in doc.rows
      if row.id == 'config'
        configDoc = row.doc
        toView.couchdb = configDoc.couchdb
      else
        todosObj[row.id] = _.create todoModelMethods, row.doc
    observer.onNext()

load$.subscribe ->
  if configDoc.couchdb
    pouchdb.sync configDoc.couchdb, live: true
      .on 'error', -> handleError

change$ = Rx.Observable.create (observer) ->
  load$.subscribe ->
    pouchdb.changes since: (configDoc.changeSeq or 'now'), live: true, include_docs: true
      .on 'change', (change) ->
        return if change.deleted
        doc = change.doc
        id = doc._id
        return if id == 'config'
        if configDoc.changeSeq != change.seq
          configDoc.changeSeq = change.seq
          putDoc configDoc
        if todo = todosObj[id]
          for key, val of doc
            if todo[key] != doc[key]
              changed = true
              todo[key] = doc[key]
          observer.onNext todo if changed?
        else
          todosObj[id] = _.create todoModelMethods, doc
          visibleIds.push id
          observer.onNext todosObj[id]

star$ = intent.star.map (id) ->
  todo = todosObj[id]
  if not todo.close
    if todo.star
      delete todo.star
    else
      todo.star = true
    todo.put()

close$ = intent.close.map (id) ->
  todo = todosObj[id]
  todo.close = if todo.close then false else util.date.format()
  delete todo.star
  delete todo.deleted
  todo.put().recur()

delete$ = intent.delete$.map (id) ->
  todo = todosObj[id]
  if todo.close
    todo.close = false
    delete todo.star
    delete todo.deleted
  else
    todo.close = util.date.format()
    todo.deleted = true
  todo.put().recur()

create$ = Rx.Observable.merge intent.create, close$, delete$
  .map (obj) ->
    return if not obj
    id = new Date().toISOString()
    todo = _.create todoModelMethods, _id: id, open: util.date.format()
    _.assign todo, obj
    todosObj[id] = todo
    todo.put()
    visibleIds.push id

editName$ = intent.editName.map (id) -> ['name', id]
editOpen$ = intent.editOpen.map (id) -> ['open', id]
editClose$ = intent.editClose.map (id) -> ['close', id]
edit$ = Rx.Observable.merge editName$, editOpen$, editClose$
  .map ([field,id]) ->
    toView.idEditing = id
    toView.fieldEditing = field

updateName$ = intent.updateName.map (name) -> ['name',name]
updateOpen$ = intent.updateOpen.map (open) -> ['open',open]
updateClose$ = intent.updateClose.map (close) -> ['close',close]
update$ = Rx.Observable.merge updateName$, updateOpen$, updateClose$
  .map ([field,value]) ->
    todo = todosObj[toView.idEditing]
    if todo[field] != value
      todo[field] = value
      todo.put()
    toView.idEditing = null

purge$ = intent.purge.map ->
  for id in visibleIds
    pouchdb.remove todosObj[id]
    delete todosObj[id]
  visibleIds = []

intent.reset.subscribe ->
  pouchdb.destroy ->
    location.reload()

sort$ = intent.sort.map (sort) -> toView.sort = sort if sort
searchStatus$ = intent.search.map (status) -> toView.status = status if status
searchName$ = Rx.Observable.merge intent.searchName, intent.project
  .map (name) -> toView.name = name
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
config$ = intent.config.map -> toView.showConfig = not toView.showConfig

couchdb$ = intent.couchdb.subscribe (server) ->
  return if server == configDoc.couchdb
  configDoc.couchdb = toView.couchdb = server
  putDoc configDoc
  pouchdb.sync server if server

@model =
  
  exportTodo: (todo) ->
    closed = if todo.close then "x #{todo.close} " else ""
    status = if todo.deleted then "status:delete " else ""
    priority = if todo.star then "(A) " else ""
    "#{closed}#{priority}#{todo.open} #{status}#{todo.name}"
    
  todos$:
    Rx.Observable.merge create$, star$, search$, export$, edit$, update$, purge$, config$, change$
      .map ->
        toView.todos = visibleIds.map (id) -> todosObj[id].clone()
        toView
