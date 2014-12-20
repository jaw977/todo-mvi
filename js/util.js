(function() {
  this.util = {
    init$: new Rx.Subject(),
    date: {
      today: function() {
        return moment().format("YYYY-MM-DD");
      },
      format: function(date) {
        if (date) {
          return "" + date.slice(5, 7) + "/" + date.slice(8, 10);
        } else {
          return "";
        }
      }
    }
  };

}).call(this);
