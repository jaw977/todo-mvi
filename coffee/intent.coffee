## Dependencies: util, view
## Exports: intent

intent = @intent = {}

targetValue = (ev) -> ev.target.value
isEnterKey = (ev) -> ev.keyCode == 13

for stream in ['search','sort','export$','config']
  intent[stream] = view[stream].map targetValue

intent.create = view.create
  .filter isEnterKey
  .map (ev) ->
    name = ev.target.value
    ev.target.value = ''
    name: name
  .filter (obj) -> obj.name.length

for stream in ['star','close','delete$','editClose']
  intent[stream] = view[stream].map (ev) -> ev.target.parentNode.parentNode.id

for stream in ['editName','editOpen']
  intent[stream] = view[stream].map (ev) -> ev.target.parentNode.id

for stream in ['updateName','searchName','couchdb']
  intent[stream] = view[stream]
    .filter isEnterKey
    .map targetValue

for stream in ['updateOpen','updateClose','closeStart','closeEnd']
  intent[stream] = view[stream].map (date) -> util.date.format date

intent.purge = view.purge
  .filter -> confirm "This will permanently remove all displayed todos from the database!  Are you sure?"
