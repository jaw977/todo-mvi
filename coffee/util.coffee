## Dependencies: Rx, moment
## Exports: util

@util =
  date:
    format: (date) -> moment(date).format "YYYY-MM-DD"
    short: (date) -> moment(date).format "MM/DD"
      
