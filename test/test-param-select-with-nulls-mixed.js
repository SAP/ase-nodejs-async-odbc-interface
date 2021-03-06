var common = require("./common")
  , odbc = require("sapase/")
  , db = new odbc.Database()
  , assert = require("assert");


db.connect(common.connectionString, function (err) {
  assert.equal(err, null);

  db.exec("select ? as \"TEXTCOL1\", ? as \"TEXTCOL2\", ? as \"NULLCOL1\" "
    , ["something", "something", null]
    , function (err, data, more) {
        if (err) { console.error(err) }
        assert.equal(err, null);
        assert.deepEqual(data, [{
            TEXTCOL1: "something",
            TEXTCOL2: "something",
            NULLCOL1: null
          }]);
        db.disconnect(function () {
        });
    });
});
