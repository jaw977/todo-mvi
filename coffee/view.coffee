## Dependencies: Rx
## Exports: view

view = @view = {}

streamNames = [
  'create'
  'star'
  'close'
  'delete$'
  'editName'
  'editOpen'
  'updateName'
  'updateOpen'
  'search'
  'export$'
  'sort'
]

for stream in streamNames
  view[stream] = new Rx.Subject()
