## Dependencies: view
## Exports: intent

intent = @intent = {}

for stream in ['close$','delete$','search$','sort$']
  intent[stream] = view[stream].map (ev) -> ev.target.value

for stream in ['purge$','export$']
  intent[stream] = view[stream]

intent.create$ = view.create$
  .map (ev) ->
    name = ev.target.value
    ev.target.value = ''
    name
  .filter (name) -> name.length

for stream in ['star$','close$','delete$']
  intent[stream] = view[stream].map (ev) -> ev.target.parentNode.parentNode.id

for stream in ['editName$','editOpen$']
  intent[stream] = view[stream].map (ev) -> ev.target.parentNode.id

for stream in ['updateName$','updateOpen$']
  intent[stream] = view[stream]
    .filter (ev) -> ev.key == 'Enter'
    .map (ev) -> ev.target.value
