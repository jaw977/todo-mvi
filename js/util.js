(function() {
  this.util = {
    date: {
      format: function(date) {
        return moment(date).format("YYYY-MM-DD");
      },
      short: function(date) {
        return moment(date).format("M/DD");
      }
    }
  };

}).call(this);
