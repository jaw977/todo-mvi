(function() {
  var stream, view, _i, _len, _oldTree, _ref, _render, _rootNode,
    __slice = [].slice;

  view = this.view = {};

  _ref = ['create$', 'updateStatus$', 'editName$', 'updateName$', 'search$', 'purge$', 'export$'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    stream = _ref[_i];
    view[stream] = new Rx.Subject();
  }

  _render = function(ev) {
    var color, event, h, heading, isDeleted, mark, status, todo;
    h = function() {
      var attrs, children, tag;
      tag = arguments[0], children = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      attrs = children.length && _.isPlainObject(children[0]) ? children.shift() : {};
      return VDOM.h(tag, attrs, _.flatten(children, true));
    };
    event = function(stream) {
      return function(ev) {
        return view[stream].onNext(ev);
      };
    };
    return h('div', h('button', {
      type: 'button',
      onclick: event('export$')
    }, 'Export'), ev.showExport ? h('textarea', ev.todos.map(model.exportTodo).join("\n")) : void 0, h('br'), "Add Todo: ", h('input', {
      size: 50,
      onchange: event('create$')
    }), h('br'), h('button', {
      type: 'button'
    }, 'Search'), ' ', h('select', {
      onchange: event('search$')
    }, h('option', {
      value: '0,1'
    }, 'Ready + Open'), (function() {
      var _j, _results;
      _results = [];
      for (status = _j = 1; _j <= 3; status = ++_j) {
        _results.push(h('option', {
          value: status
        }, model.statusLabels[status]));
      }
      return _results;
    })(), h('option', {
      value: ''
    }, 'All')), ev.status && ev.status[0] === 3 ? h('button', {
      type: 'button',
      onclick: event('purge$')
    }, 'Purge Deleted') : void 0, h('br'), h('br'), h('table', h('tr', (function() {
      var _j, _len1, _ref1, _results;
      _ref1 = ['ID', 'Status', 'Open', 'Description'];
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        heading = _ref1[_j];
        _results.push(h('th', heading));
      }
      return _results;
    })()), (function() {
      var _j, _len1, _ref1, _results;
      _ref1 = ev.todos;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        todo = _ref1[_j];
        _results.push(h('tr', {
          id: todo._id
        }, h('td', todo.order.toString()), h('td', h('button', {
          type: 'button',
          value: todo._id,
          onclick: event('updateStatus$')
        }, model.statusLabels[todo.status])), h('td', util.date.format(todo.open)), h('td', todo.close ? (isDeleted = todo.status === 3, color = isDeleted ? "red" : "green", mark = isDeleted ? "×" : "✓", h('span', {
          style: "color:" + color
        }, "" + mark + " " + (util.date.format(todo.close)) + " ")) : "", ev.idEditing === todo._id ? h('input', {
          size: 50,
          value: todo.name,
          onkeydown: event('updateName$')
        }) : h('span', {
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
