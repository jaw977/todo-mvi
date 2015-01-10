## Dependencies: util, view
## Exports: intent

intent = @intent = {}

targetValue = (ev) -> ev.target.value
isEnterKey = (ev) -> ev.keyCode == 13

for stream in ['search','sort','export$','config','project']
  intent[stream] = view[stream].map targetValue

intent.create = view.create
  .filter isEnterKey
  .map (ev) ->
    name = ev.target.value
    ev.target.value = ''
    name: name
  .filter (obj) -> obj.name.length

for stream in ['editName','editOpen','editClose','star','close','delete$']
  intent[stream] = view[stream].map (ev) ->
    el = ev.target
    el = el.parentNode while el.tagName != 'TR'
    el.id

for stream in ['updateName','searchName','couchdb']
  intent[stream] = view[stream]
    .filter isEnterKey
    .map targetValue

for stream in ['updateOpen','updateClose','closeStart','closeEnd']
  intent[stream] = view[stream].map (date) -> util.date.format date

intent.purge = view.purge
  .filter -> confirm "This will permanently remove all displayed todos from the database!  Are you sure?"
