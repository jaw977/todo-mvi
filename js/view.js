(function() {
  var view, _event, _htmlTag, _oldTree, _render, _rootNode,
    __slice = [].slice;

  view = this.view = {};

  _event = {};

  ['create$', 'star$', 'close$', 'delete$', 'editName$', 'editOpen$', 'updateName$', 'updateOpen$', 'search$', 'purge$', 'export$', 'sort$'].forEach(function(stream) {
    view[stream] = new Rx.Subject();
    return _event[stream] = function(ev) {
      return view[stream].onNext(ev);
    };
  });

  _htmlTag = function() {
    var attrs, children, tag;
    tag = arguments[0], children = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    attrs = children.length && _.isPlainObject(children[0]) ? children.shift() : {};
    return VDOM.h(tag, attrs, _.flatten(children, true));
  };

  ['div', 'span', 'button', 'br', 'input', 'textarea', 'select', 'option', 'table', 'tr', 'th', 'td'].forEach(function(tag) {
    return _htmlTag[tag] = function() {
      var children;
      children = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return _htmlTag.apply(null, [tag].concat(__slice.call(children)));
    };
  });

  _render = function(ev) {
    var color, h, heading, mark, rowColor, today, todo;
    h = _htmlTag;
    today = util.date.today();
    return h.div({}, h.button({
      type: 'button',
      onclick: _event.export$
    }, 'Export'), ev.showExport ? h.textarea(ev.todos.map(model.exportTodo).join("\n")) : void 0, h.br(), "Add Todo: ", h.input({
      size: 50,
      onchange: _event.create$
    }), h.br(), h.button({
      type: 'button',
      onclick: _event.search$
    }, 'Search'), ' ', h.select({
      onchange: _event.search$
    }, h.option({
      value: 'open'
    }, 'Open'), h.option({
      value: 'star'
    }, 'Starred'), h.option({
      value: 'close'
    }, 'Closed'), h.option({
      value: 'all'
    }, 'All')), h.select({
      onchange: _event.sort$
    }, h.option({
      value: 'star,open,name'
    }, 'Starred First, then opened earliest first'), h.option({
      value: 'star,name'
    }, 'Starred First'), h.option({
      value: 'close,name'
    }, 'Closed earliest first')), h.br(), h.br(), h.table({}, h.tr({}, (function() {
      var _i, _len, _ref, _results;
      _ref = ['ID', 'Open', 'Status', 'Description'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        heading = _ref[_i];
        _results.push(h.th(heading));
      }
      return _results;
    })()), (function() {
      var _i, _len, _ref, _results;
      _ref = ev.todos;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        todo = _ref[_i];
        rowColor = todo.open <= today || todo.star ? "black" : "silver";
        _results.push(h.tr({
          id: todo._id,
          style: "color:" + rowColor
        }, h.td(todo.order.toString()), ev.idEditing === todo._id && ev.fieldEditing === 'open' ? h.td(h.input({
          size: 8,
          value: todo.open,
          onkeydown: _event.updateOpen$
        })) : h.td({
          ondblclick: _event.editOpen$
        }, util.date.format(todo.open)), h.td({}, todo.close ? (color = todo.deleted ? "red" : "green", mark = todo.deleted ? "×" : "✓", h.span({
          style: "color:" + color + "; cursor:pointer",
          onclick: _event.close$
        }, "" + mark + " " + (util.date.format(todo.close)) + " ")) : (color = todo.star ? "orange" : "silver", mark = todo.star ? "★" : "☆", [
          h.span({
            style: "color:silver; cursor:pointer",
            onclick: _event.close$
          }, "✓ "), h.span({
            style: "color:silver; cursor:pointer",
            onclick: _event.delete$
          }, "× "), h.span({
            style: "color:" + color + "; cursor:pointer",
            onclick: _event.star$
          }, "" + mark + " ")
        ])), ev.idEditing === todo._id && ev.fieldEditing === 'name' ? h.td(h.input({
          size: 50,
          value: todo.name,
          onkeydown: _event.updateName$
        })) : h.td({
          style: "color:" + rowColor,
          ondblclick: _event.editName$
        }, todo.name)));
      }
      return _results;
    })()));
  };

  _oldTree = null;

  _rootNode = null;

  util.init$.subscribe(function(ev) {
    if (ev !== 'model') {
      return;
    }
    return model.todos$.subscribe(function(ev) {
      var newTree;
      newTree = _render(ev);
      if (_oldTree) {
        _rootNode = VDOM.patch(_rootNode, VDOM.diff(_oldTree, newTree));
      } else {
        _rootNode = VDOM.createElement(newTree);
        document.body.appendChild(_rootNode);
      }
      return _oldTree = newTree;
    });
  });

}).call(this);
