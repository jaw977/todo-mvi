(function() {
  var stream, view, _htmlTag, _i, _len, _oldTree, _ref, _render, _rootNode,
    __slice = [].slice;

  view = this.view = {};

  _ref = ['create$', 'star$', 'close$', 'delete$', 'editName$', 'editOpen$', 'updateName$', 'updateOpen$', 'search$', 'purge$', 'export$', 'sort$'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    stream = _ref[_i];
    view[stream] = new Rx.Subject();
  }

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
    var color, event, h, heading, mark, today, todo;
    h = _htmlTag;
    event = function(stream) {
      return function(ev) {
        return view[stream].onNext(ev);
      };
    };
    today = util.date.today();
    return h.div({}, h.button({
      type: 'button',
      onclick: event('export$')
    }, 'Export'), ev.showExport ? h.textarea(ev.todos.map(model.exportTodo).join("\n")) : void 0, h.br(), "Add Todo: ", h.input({
      size: 50,
      onchange: event('create$')
    }), h.br(), h.button({
      type: 'button',
      onclick: event('search$')
    }, 'Search'), ' ', h.select({
      onchange: event('search$')
    }, h.option({
      value: 'open'
    }, 'Open'), h.option({
      value: 'star'
    }, 'Starred'), h.option({
      value: 'close'
    }, 'Closed'), h.option({
      value: 'all'
    }, 'All')), h.select({
      onchange: event('sort$')
    }, h.option({
      value: 'star,open,name'
    }, 'Starred First, then opened earliest first'), h.option({
      value: 'star,name'
    }, 'Starred First'), h.option({
      value: 'close,name'
    }, 'Closed earliest first')), h.br(), h.br(), h.table({}, h.tr({}, (function() {
      var _j, _len1, _ref1, _results;
      _ref1 = ['ID', 'Status', 'Open', 'Description'];
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        heading = _ref1[_j];
        _results.push(h.th(heading));
      }
      return _results;
    })()), (function() {
      var _j, _len1, _ref1, _results;
      _ref1 = ev.todos;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        todo = _ref1[_j];
        _results.push(h.tr({
          id: todo._id,
          style: (todo.open > today ? "color:silver" : "color:black")
        }, h.td(todo.order.toString()), h.td({}, h.button({
          type: 'button',
          value: todo._id,
          onclick: event('star$')
        }, "★"), h.button({
          type: 'button',
          value: todo._id,
          onclick: event('close$')
        }, "✓"), h.button({
          type: 'button',
          value: todo._id,
          onclick: event('delete$')
        }, "×")), ev.idEditing === todo._id && ev.fieldEditing === 'open' ? h.td(h.input({
          size: 8,
          value: todo.open,
          onkeydown: event('updateOpen$')
        })) : h.td({
          ondblclick: event('editOpen$')
        }, util.date.format(todo.open)), h.td({}, todo.close ? (color = todo.deleted ? "red" : "green", mark = todo.deleted ? "×" : "✓", h.span({
          style: "color:" + color
        }, "" + mark + " " + (util.date.format(todo.close)) + " ")) : todo.star ? h.span({
          style: "color:blue"
        }, "★ ") : "", ev.idEditing === todo._id && ev.fieldEditing === 'name' ? h.input({
          size: 50,
          value: todo.name,
          onkeydown: event('updateName$')
        }) : h.span({
          ondblclick: event('editName$')
        }, todo.name))));
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
