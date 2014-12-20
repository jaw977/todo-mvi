## Dependencies: Rx, moment
## Exports: util

@util =
  init$: new Rx.Subject()
  date:
    today: -> moment().format "YYYY-MM-DD"
    format: (date) -> if date then "#{date[5..6]}/#{date[8..9]}" else ""
      
