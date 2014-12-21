## Dependencies: Rx, VDOM (virtual-dom, virtual-hyperscript), _ (lodash), util
## Exports: view

view = @view = {}

for stream in ['create$','star$','close$','delete$','editName$','updateName$','search$','purge$','export$']
  view[stream] = new Rx.Subject()

_htmlTag = (tag, children...) ->
  attrs = if children.length and _.isPlainObject children[0] then children.shift() else {}
  VDOM.h tag, attrs, _.flatten children, true
['div','span','button','br','input','textarea','select','option','table','tr','th','td'].forEach (tag) ->
  _htmlTag[tag] = (children...) -> _htmlTag tag, children...

_render = (ev) ->
  #console.log ev
  h = _htmlTag
  event = (stream) -> (ev) -> view[stream].onNext ev

  h.div {},
    h.button type: 'button', onclick: event('export$'), 'Export'
    if ev.showExport then h.textarea ev.todos.map(model.exportTodo).join "\n"
    h.br()
    "Add Todo: "
    h.input size: 50, onchange: event('create$')
    h.br()
    h.button type: 'button', onclick: event('search$'), 'Search'
    ' '
    h.select onchange: event('search$'),
      h.option value: 'open', 'Open'
      h.option value: 'star', 'Starred'
      h.option value: 'close', 'Closed'
      h.option value: 'all', 'All'
    #if ev.status and ev.status[0] == 3 then h 'button', type: 'button', onclick: event('purge$'), 'Purge Deleted'
    h.br()
    h.br()
    h.table {},
      h.tr {}, 
        for heading in ['ID','Status','Open','Description']
          h.th heading
      for todo in ev.todos
        h.tr id: todo._id,
          h.td todo.order.toString()
          h.td {},
            h.button type: 'button', value: todo._id, onclick: event('star$'), "★"
            h.button type: 'button', value: todo._id, onclick: event('close$'), "✓"
            h.button type: 'button', value: todo._id, onclick: event('delete$'), "×"
          h.td util.date.format todo.open
          h.td {},
            if todo.close
              isDeleted = todo.status == 'delete'
              color = if isDeleted then "red" else "green"
              mark = if isDeleted then "×" else "✓"
              h.span style: "color:#{color}", "#{mark} #{util.date.format todo.close} "
            else if todo.status == 'star'
              h.span style: "color:blue", "★ "
            else ""
            if ev.idEditing == todo._id
              h.input size: 50, value: todo.name, onkeydown: event('updateName$')
            else
              h.span ondblclick: event('editName$'), todo.name
            
_oldTree = null
_rootNode = null

util.init$.subscribe (ev) ->
  return unless ev == 'model'
  model.todos$.subscribe (ev) ->
    newTree = _render ev
    if _oldTree
      _rootNode = VDOM.patch _rootNode, VDOM.diff _oldTree, newTree
    else
      _rootNode = VDOM.createElement newTree
      document.body.appendChild _rootNode
    _oldTree = newTree
    
