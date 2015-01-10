## Dependencies: VDOM(virtual-dom, virtual-hyperscript), _(lodash), Pikaday, util, view, model

emitEvent = _.mapValues view, (stream) -> (ev) -> stream.onNext ev

htmlTag = (tag, children...) ->
  attrs = if children.length and _.isPlainObject children[0] then children.shift() else {}
  VDOM.h tag, attrs, _.flatten children, true
['div','span','button','br','input','textarea','select','option','table','tr','th','td','p','a'].forEach (tag) ->
  htmlTag[tag] = (children...) -> htmlTag tag, children...

renderTodoName = (todo) ->
  name = ' ' + todo.name
  formatted = []
  while matches = name.match /(.*?\s)([\+\@]\w*)(.*)/
    [all, before, project, name] = matches
    formatted.push before if formatted.length or before.match /\w/
    className = if project[0] == '+' then 'project' else 'context'
    formatted.push htmlTag.span onclick: emitEvent.project, value: project, className: className, project
  formatted.push name if name.match /\w/
  formatted

render = (ev) ->
  #console.log ev
  h = htmlTag
  e = emitEvent
  today = util.date.format()

  h.div {},
    "Add Todo: "
    h.input size: 50, onkeydown: e.create
    h.br()
    h.button type: 'button', onclick: e.search, 'Search'
    ' '
    h.select onchange: e.search,
      h.option value: 'open', 'Open'
      h.option value: 'star', 'Starred'
      h.option value: 'close', 'Closed'
      h.option value: 'all', 'All'
    ' Description:'
    h.input onkeydown: e.searchName, value: ev.name
    ' Closed between:'
    h.input id: 'closeStart', size: 8
    '-'
    h.input id: 'closeEnd', size: 8 
    h.br()
    h.select onchange: e.sort,
      h.option value: 'star,open,name', 'Starred First, then opened earliest first'
      h.option value: 'star,name', 'Starred First'
      h.option value: 'close,name', 'Closed earliest first'
    h.button type: 'button', onclick: e.export$, 'Export to todo.txt'
    h.button type: 'button', onclick: e.purge, 'Purge all displayed todos'
    h.button type: 'button', onclick: e.config, 'Config'
    if ev.showExport then h.p h.textarea rows: 10, cols: 80, ev.todos.map(model.exportTodo).join "\n"
    if ev.showConfig then h.p 'CouchDB Server: ', h.input onkeydown: e.couchdb, value: ev.couchdb
    h.br()
    h.br()
    h.table {},
      h.tr {}, 
        for heading in ['Open','Status','Description']
          h.th " #{heading} "
      for todo in ev.todos
        h.tr id: todo._id, className: (if todo.open <= today or todo.star then "" else "future"),
          if ev.idEditing == todo._id and ev.fieldEditing == 'open'
            h.td h.input size: 8, value: todo.open, id:'datepicker'
          else
            h.td ondblclick: e.editOpen, util.date.short todo.open
          h.td {},
            if todo.close
              className = if todo.deleted then "deleted" else "closed"
              mark = if todo.deleted then "×" else "✓"
              [ h.span className: className, onclick: e.close, "#{mark} "
                if ev.idEditing == todo._id and ev.fieldEditing == 'close'
                  h.input size: 8, value: todo.close, id:'datepicker'
                else
                  h.span className: className, ondblclick: e.editClose, util.date.short todo.close
              ]
            else 
              className = if todo.star then "starred" else "off"
              mark = if todo.star then "★" else "☆"
              [ h.span className: "off", onclick: e.close, "✓ "
                h.span className: "off", onclick: e.delete$, "× "
                h.span className: className, onclick: e.star, "#{mark} " ]
          if ev.idEditing == todo._id and ev.fieldEditing == 'name'
            h.td h.input size: 50, value: todo.name, onkeydown: e.updateName
          else
            h.td ondblclick: e.editName, renderTodoName todo
            
oldTree = null
rootNode = null
pikaday = null

model.todos$.subscribe (ev) ->
  newTree = render ev
  if oldTree
    rootNode = VDOM.patch rootNode, VDOM.diff oldTree, newTree
  else
    rootNode = VDOM.createElement newTree
    document.body.appendChild rootNode
    for field in ['closeStart','closeEnd']
      new Pikaday onSelect: emitEvent[field], field: document.getElementById field
  oldTree = newTree

  datepicker = document.getElementById 'datepicker'
  if datepicker
    if not pikaday
      pikaday = new Pikaday field: datepicker, onSelect: emitEvent[if ev.fieldEditing == 'close' then 'updateClose' else 'updateOpen']
      pikaday.show()
  else if pikaday
    pikaday.destroy()
    pikaday = null
