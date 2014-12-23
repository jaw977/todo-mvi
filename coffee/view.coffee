## Dependencies: Rx, VDOM (virtual-dom, virtual-hyperscript), _ (lodash), util
## Exports: view

view = @view = {}
_event = {}

['create$','star$','close$','delete$','editName$','editOpen$','updateName$','updateOpen$','search$','purge$','export$','sort$'].forEach (stream) ->
  view[stream] = new Rx.Subject()
  _event[stream] = (ev) -> view[stream].onNext ev

_htmlTag = (tag, children...) ->
  attrs = if children.length and _.isPlainObject children[0] then children.shift() else {}
  VDOM.h tag, attrs, _.flatten children, true
['div','span','button','br','input','textarea','select','option','table','tr','th','td','p'].forEach (tag) ->
  _htmlTag[tag] = (children...) -> _htmlTag tag, children...

_render = (ev) ->
  #console.log ev
  h = _htmlTag
  today = util.date.today()

  h.div {},
    "Add Todo: "
    h.input size: 50, onchange: _event.create$
    h.br()
    h.button type: 'button', onclick: _event.search$, 'Search'
    ' '
    h.select onchange: _event.search$,
      h.option value: 'open', 'Open'
      h.option value: 'star', 'Starred'
      h.option value: 'close', 'Closed'
      h.option value: 'all', 'All'
    #if ev.status and ev.status[0] == 3 then h 'button', type: 'button', onclick: event('purge$'), 'Purge Deleted'
    h.select onchange: _event.sort$,
      h.option value: 'star,open,name', 'Starred First, then opened earliest first'
      h.option value: 'star,name', 'Starred First'
      h.option value: 'close,name', 'Closed earliest first'
    h.button type: 'button', onclick: _event.export$, 'Export to todo.txt'
    if ev.showExport then h.p h.textarea rows: 10, cols: 80, ev.todos.map(model.exportTodo).join "\n"
    h.br()
    h.br()
    h.table {},
      h.tr {}, 
        for heading in ['Open','Status','Description']
          h.th " #{heading} "
      for todo in ev.todos
        rowColor = if todo.open <= today or todo.star then "black" else "silver"
        h.tr id: todo._id, style: "color:#{rowColor}",
          if ev.idEditing == todo._id and ev.fieldEditing == 'open'
            h.td h.input size: 8, value: todo.open, onkeydown: _event.updateOpen$
          else
            h.td ondblclick: _event.editOpen$, util.date.format todo.open
          h.td {},
            if todo.close
              color = if todo.deleted then "red" else "green"
              mark = if todo.deleted then "×" else "✓"
              h.span style: "color:#{color}; cursor:pointer", onclick: _event.close$, "#{mark} #{util.date.format todo.close} "
            else 
              color = if todo.star then "orange" else "silver"
              mark = if todo.star then "★" else "☆"
              [ h.span style: "color:silver; cursor:pointer", onclick: _event.close$, "✓ "
                h.span style: "color:silver; cursor:pointer", onclick: _event.delete$, "× "
                h.span style: "color:#{color}; cursor:pointer", onclick: _event.star$, "#{mark} " ]
          if ev.idEditing == todo._id and ev.fieldEditing == 'name'
            h.td h.input size: 50, value: todo.name, onkeydown: _event.updateName$
          else
            h.td style: "color:#{rowColor}", ondblclick: _event.editName$, todo.name
            
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
    
