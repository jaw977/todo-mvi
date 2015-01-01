## Dependencies: util, view
## Exports: intent

intent = @intent = {}

targetValue = (ev) -> ev.target.value
isEnterKey = (ev) -> ev.keyCode == 13

for stream in ['search','sort','export$']
  intent[stream] = view[stream].map targetValue

intent.create = view.create
  .filter isEnterKey
  .map (ev) ->
    name = ev.target.value
    ev.target.value = ''
    name
  .filter (name) -> name.length

for stream in ['star','close','delete$']
  intent[stream] = view[stream].map (ev) -> ev.target.parentNode.parentNode.id

for stream in ['editName','editOpen']
  intent[stream] = view[stream].map (ev) -> ev.target.parentNode.id

for stream in ['updateName']
  intent[stream] = view[stream]
    .filter isEnterKey
    .map targetValue

intent.updateOpen = view.updateOpen.map (date) -> util.date.format date
