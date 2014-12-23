(function() {
  this.util = {
    init$: new Rx.Subject(),
    date: {
      format: function(date) {
        return moment(date).format("YYYY-MM-DD");
      },
      short: function(date) {
        return moment(date).format("MM/DD");
      }
    }
  };

}).call(this);
