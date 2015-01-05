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
  'editClose'
  'updateName'
  'updateOpen'
  'updateClose'
  'search'
  'searchName'
  'export$'
  'sort'
  'closeStart'
  'closeEnd'
  'purge'
]

for stream in streamNames
  view[stream] = new Rx.Subject()
