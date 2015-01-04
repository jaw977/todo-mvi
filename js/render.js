(function() {
  var emitEvent, htmlTag, oldTree, pikaday, render, rootNode,
    __slice = [].slice;

  emitEvent = _.mapValues(view, function(stream) {
    return function(ev) {
      return stream.onNext(ev);
    };
  });

  htmlTag = function() {
    var attrs, children, tag;
    tag = arguments[0], children = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    attrs = children.length && _.isPlainObject(children[0]) ? children.shift() : {};
    return VDOM.h(tag, attrs, _.flatten(children, true));
  };

  ['div', 'span', 'button', 'br', 'input', 'textarea', 'select', 'option', 'table', 'tr', 'th', 'td', 'p'].forEach(function(tag) {
    return htmlTag[tag] = function() {
      var children;
      children = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return htmlTag.apply(null, [tag].concat(__slice.call(children)));
    };
  });

  render = function(ev) {
    var className, e, h, heading, mark, today, todo;
    h = htmlTag;
    e = emitEvent;
    today = util.date.format();
    return h.div({}, "Add Todo: ", h.input({
      size: 50,
      onkeydown: e.create
    }), h.br(), h.button({
      type: 'button',
      onclick: e.search
    }, 'Search'), ' ', h.select({
      onchange: e.search
    }, h.option({
      value: 'open'
    }, 'Open'), h.option({
      value: 'star'
    }, 'Starred'), h.option({
      value: 'close'
    }, 'Closed'), h.option({
      value: 'all'
    }, 'All')), ' Description:', h.input({
      onkeydown: e.searchName
    }), ' Closed between:', h.input({
      id: 'closeStart',
      size: 8
    }), '-', h.input({
      id: 'closeEnd',
      size: 8
    }), h.br(), h.select({
      onchange: e.sort
    }, h.option({
      value: 'star,open,name'
    }, 'Starred First, then opened earliest first'), h.option({
      value: 'star,name'
    }, 'Starred First'), h.option({
      value: 'close,name'
    }, 'Closed earliest first')), h.button({
      type: 'button',
      onclick: e.export$
    }, 'Export to todo.txt'), h.button({
      type: 'button',
      onclick: e.purge
    }, 'Purge all displayed todos'), ev.showExport ? h.p(h.textarea({
      rows: 10,
      cols: 80
    }, ev.todos.map(model.exportTodo).join("\n"))) : void 0, h.br(), h.br(), h.table({}, h.tr({}, (function() {
      var _i, _len, _ref, _results;
      _ref = ['Open', 'Status', 'Description'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        heading = _ref[_i];
        _results.push(h.th(" " + heading + " "));
      }
      return _results;
    })()), (function() {
      var _i, _len, _ref, _results;
      _ref = ev.todos;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        todo = _ref[_i];
        _results.push(h.tr({
          id: todo._id,
          className: (todo.open <= today || todo.star ? "" : "future")
        }, ev.idEditing === todo._id && ev.fieldEditing === 'open' ? h.td(h.input({
          size: 8,
          value: todo.open,
          id: 'datepicker'
        })) : h.td({
          ondblclick: e.editOpen
        }, util.date.short(todo.open)), h.td({}, todo.close ? (className = todo.deleted ? "deleted" : "closed", mark = todo.deleted ? "×" : "✓", h.span({
          className: className,
          onclick: e.close
        }, "" + mark + " " + (util.date.short(todo.close)) + " ")) : (className = todo.star ? "starred" : "off", mark = todo.star ? "★" : "☆", [
          h.span({
            className: "off",
            onclick: e.close
          }, "✓ "), h.span({
            className: "off",
            onclick: e.delete$
          }, "× "), h.span({
            className: className,
            onclick: e.star
          }, "" + mark + " ")
        ])), ev.idEditing === todo._id && ev.fieldEditing === 'name' ? h.td(h.input({
          size: 50,
          value: todo.name,
          onkeydown: e.updateName
        })) : h.td({
          ondblclick: e.editName
        }, todo.name)));
      }
      return _results;
    })()));
  };

  oldTree = null;

  rootNode = null;

  pikaday = null;

  model.todos$.subscribe(function(ev) {
    var datepicker, field, newTree, _i, _len, _ref;
    newTree = render(ev);
    if (oldTree) {
      rootNode = VDOM.patch(rootNode, VDOM.diff(oldTree, newTree));
    } else {
      rootNode = VDOM.createElement(newTree);
      document.body.appendChild(rootNode);
      _ref = ['closeStart', 'closeEnd'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        new Pikaday({
          onSelect: emitEvent[field],
          field: document.getElementById(field)
        });
      }
    }
    oldTree = newTree;
    datepicker = document.getElementById('datepicker');
    if (datepicker) {
      if (!pikaday) {
        pikaday = new Pikaday({
          field: datepicker,
          onSelect: emitEvent.updateOpen
        });
        return pikaday.show();
      }
    } else if (pikaday) {
      pikaday.destroy();
      return pikaday = null;
    }
  });

}).call(this);
