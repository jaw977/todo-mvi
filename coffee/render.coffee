## Dependencies: VDOM(virtual-dom, virtual-hyperscript), _(lodash), util, view, model

_event = _.transform view, (result, stream, name) ->
  result[name] = (ev) -> stream.onNext ev

_htmlTag = (tag, children...) ->
  attrs = if children.length and _.isPlainObject children[0] then children.shift() else {}
  VDOM.h tag, attrs, _.flatten children, true
['div','span','button','br','input','textarea','select','option','table','tr','th','td','p'].forEach (tag) ->
  _htmlTag[tag] = (children...) -> _htmlTag tag, children...

_render = (ev) ->
  #console.log ev
  h = _htmlTag
  today = util.date.format()

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
        h.tr id: todo._id, className: (if todo.open <= today or todo.star then "" else "future"),
          if ev.idEditing == todo._id and ev.fieldEditing == 'open'
            h.td h.input size: 8, value: todo.open, id:'datepicker'
          else
            h.td ondblclick: _event.editOpen$, util.date.short todo.open
          h.td {},
            if todo.close
              className = if todo.deleted then "deleted" else "closed"
              mark = if todo.deleted then "×" else "✓"
              h.span className: className, onclick: _event.close$, "#{mark} #{util.date.short todo.close} "
            else 
              className = if todo.star then "starred" else "off"
              mark = if todo.star then "★" else "☆"
              [ h.span className: "off", onclick: _event.close$, "✓ "
                h.span className: "off", onclick: _event.delete$, "× "
                h.span className: className, onclick: _event.star$, "#{mark} " ]
          if ev.idEditing == todo._id and ev.fieldEditing == 'name'
            h.td h.input size: 50, value: todo.name, onkeydown: _event.updateName$
          else
            h.td ondblclick: _event.editName$, todo.name
            
_oldTree = null
_rootNode = null
_pikaday = null

model.todos$.subscribe (ev) ->
  newTree = _render ev
  if _oldTree
    _rootNode = VDOM.patch _rootNode, VDOM.diff _oldTree, newTree
  else
    _rootNode = VDOM.createElement newTree
    document.body.appendChild _rootNode
  _oldTree = newTree

  datepicker = document.getElementById 'datepicker'
  if datepicker
    if not _pikaday
      _pikaday = new Pikaday field: datepicker, onSelect: _event.updateOpen$
      _pikaday.show()
  else if _pikaday
    _pikaday.destroy()
    _pikaday = null
