(function() {
  var emitEvent, htmlTag, oldTree, pikaday, render, renderTodoName, rootNode,
    __slice = [].slice;

  emitEvent = _.mapValues(view, function(stream) {
    return function(ev) {
      return stream.onNext(ev);
    };
  });

  htmlTag = {};

  ['div', 'span', 'button', 'br', 'input', 'textarea', 'select', 'option', 'table', 'tr', 'th', 'td', 'p', 'a'].forEach(function(tag) {
    return htmlTag[tag] = function() {
      var attrs, children;
      children = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      attrs = children.length && _.isPlainObject(children[0]) ? children.shift() : {};
      return VDOM.h(tag, attrs, _.flatten(_.filter(children), true));
    };
  });

  renderTodoName = function(todo) {
    var all, before, className, formatted, matches, name, project;
    name = ' ' + todo.name;
    formatted = [];
    while (matches = name.match(/(.*?\s)([\+\@]\w*)(.*)/)) {
      all = matches[0], before = matches[1], project = matches[2], name = matches[3];
      if (formatted.length || before.match(/\w/)) {
        formatted.push(before);
      }
      className = project[0] === '+' ? 'project' : 'context';
      formatted.push(htmlTag.span({
        onclick: emitEvent.project,
        value: project,
        className: className
      }, project));
    }
    if (name.match(/\w/)) {
      formatted.push(name);
    }
    return formatted;
  };

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
      onkeydown: e.searchName,
      value: ev.name
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
    }, 'Purge all displayed todos'), h.button({
      type: 'button',
      onclick: e.config
    }, 'Config'), ev.showExport ? h.p(h.textarea({
      rows: 10,
      cols: 80
    }, ev.todos.map(model.exportTodo).join("\n"))) : void 0, ev.showConfig ? h.p('CouchDB Server: ', h.input({
      onkeydown: e.couchdb,
      value: ev.couchdb
    })) : void 0, h.br(), h.br(), h.table({}, h.tr({}, (function() {
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
        }, util.date.short(todo.open)), h.td({}, todo.close ? (className = todo.deleted ? "deleted" : "closed", mark = todo.deleted ? "×" : "✓", [
          h.span({
            className: className,
            onclick: e.close
          }, "" + mark + " "), ev.idEditing === todo._id && ev.fieldEditing === 'close' ? h.input({
            size: 8,
            value: todo.close,
            id: 'datepicker'
          }) : h.span({
            className: className,
            ondblclick: e.editClose
          }, util.date.short(todo.close))
        ]) : (className = todo.star ? "starred" : "off", mark = todo.star ? "★" : "☆", [
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
        }, renderTodoName(todo))));
      }
      return _results;
    })()));
  };

  oldTree = null;

  rootNode = null;

  pikaday = null;

  model.todos$.subscribe(function(ev) {
    var datepicker, diff, field, newTree, _i, _len, _ref;
    newTree = render(ev);
    if (oldTree) {
      diff = VDOM.diff(oldTree, newTree);
      rootNode = VDOM.patch(rootNode, diff);
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
          onSelect: emitEvent[ev.fieldEditing === 'close' ? 'updateClose' : 'updateOpen']
        });
        return pikaday.show();
      }
    } else if (pikaday) {
      pikaday.destroy();
      return pikaday = null;
    }
  });

}).call(this);
