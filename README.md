# todo-mvi

A test application I'm writing to learn functional reactive programming with javascript / coffeescript.

[Run the application demo](http://rawgit.com/jaw977/todo-mvi/master/index.html)

## Design

The design is based on [Model-View-Intent](http://futurice.com/blog/reactive-mvc-and-the-virtual-dom) by [André Staltz](https://github.com/staltz).  

- util.coffee:  Creates the util object, which exposes several date utility methods
- view.coffee:  Creates the view object, which exposes Rx.Subject streams for web browser events
- intent.coffee:  Observes the above view streams, mapping them to intent streams for use by the model. 
- model.coffee:  Loads the initial todos from PouchDB.  Observes the above intent streams, updating the internal application state and saving changes to PouchDB as needed.  Exposes a single stream which emits an event containing the data needed by the renderer when the application state changes. 
- render.coffee:  Observes the above model stream.  When an event is observed, renders the screen using virtual-dom.  Browser events will be emitted to the streams in the view object.

(note, this does not work exactly as Staltz designed.  For example, the view does not export a stream of the virtual-dom tree for a renderer to observe.  Instead, render.coffee just subscribes to the model events and renders the screen directly.  May be something to clean up in the future.)

## Features

- Uses PouchDB to save todos in browser database (IndexedDB or WebSQL)
- Double click a todo's Description to edit it
- Double click a todo's Open Date to change it (it defaults to the creation date).  If set to the future, the todo is greyed out (this can be used to create todos which are not ready to be worked yet)
- Export todos to todo.txt format

## Todo

- Recur a todo
- Automatic Recur when closed and indicated by description (e.g. "recur:+3d")
- Multi-update
- Purge
- Filter on date range (Open or close date)
- Double-click Close Date to edit it
- PouchDB: View to select only open todos, Sync to CouchDB
- Import from todo.txt
- Recognize / format todo.txt project, context
- Use Immutable.js
- package.json for gulp & plugins
- Use module system / browserify
- Write tests

## Dependencies

- ES5 compatible web browser
- [lodash](https://lodash.com/)
- [virtual-dom](https://github.com/Matt-Esch/virtual-dom)
- [RxJS](https://github.com/Reactive-Extensions/RxJS) (rx.lite.js)
- [PouchDB](http://pouchdb.com/)
- [Moment.js](http://momentjs.com/)
- [Pikaday](https://github.com/dbushell/Pikaday)

## LICENSE

The MIT License (MIT)

Copyright (c) 2014 Jason Waag

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

