## Dependencies: util, view
## Exports: intent

intent = @intent = {}

for stream in ['close$','delete$','search$','sort$']
  intent[stream] = view[stream].map (ev) -> ev.target.value

for stream in ['export$']
  intent[stream] = view[stream]

intent.create$ = view.create$
  .filter (ev) -> ev.keyCode == 13
  .map (ev) ->
    name = ev.target.value
    ev.target.value = ''
    name
  .filter (name) -> name.length

for stream in ['star$','close$','delete$']
  intent[stream] = view[stream].map (ev) -> ev.target.parentNode.parentNode.id

for stream in ['editName$','editOpen$']
  intent[stream] = view[stream].map (ev) -> ev.target.parentNode.id

for stream in ['updateName$']
  intent[stream] = view[stream]
    .filter (ev) -> ev.keyCode == 13
    .map (ev) -> ev.target.value

intent.updateOpen$ = view.updateOpen$.map (date) -> util.date.format date
