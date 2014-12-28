## Dependencies: Rx
## Exports: view

view = @view = {}

['create$','star$','close$','delete$','editName$','editOpen$','updateName$','updateOpen$','search$','export$','sort$'].forEach (stream) ->
  view[stream] = new Rx.Subject()
