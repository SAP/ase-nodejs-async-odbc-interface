var fs = require("fs")
  , common = require('./common.js')
  , spawn = require("child_process").spawn
  , errorCount = 0
  , testCount = 0
  , testTimeout = 15000
  , requestedTest = null
  , files
  ;

var filesDisabled = fs.readdirSync("./disabled");

if (filesDisabled.length) {
  console.log("\n\033[01;31mWarning\033[01;0m : there are %s disabled tests\n", filesDisabled.length);
}

if (process.argv.length === 3) {
  requestedTest = process.argv[2];
}

var connectionStrings = common.testConnectionStrings;

//check to see if the requested test is actually a driver to test
if (requestedTest) {
  connectionStrings.forEach(function (connectionString) {
    if (requestedTest == connectionString.title) {
      connectionStrings = [connectionString];
      requestedTest = null;
    }
  });
}

doNextConnectionString();


function doTest(file, connectionString) {
  var test = spawn("node", ['--expose_gc',file, connectionString.connectionString])
    , timer = null
    , timedOut = false;
    ;

  process.stdout.write("Running test for [\033[01;29m" + connectionString.title + "\033[01;0m] : " + file.replace(/\.js$/, ""));
  process.stdout.write(" ... ");

  testCount += 1;

  //TODO: process the following if some flag is set
  test.stdout.pipe(process.stdout);
  test.stderr.pipe(process.stderr);

  test.on("exit", function (code, signal) {
    clearTimeout(timer);

    if (code != 0) {
      errorCount += 1;

      process.stdout.write("\033[01;31mfail \033[01;0m ");

      if (timedOut) {
        process.stdout.write("(Timed Out)");
      }
    }
    else {
      process.stdout.write("\033[01;32msuccess \033[01;0m ");
    }

    process.stdout.write("\n");

    doNextTest(connectionString);
  });

  var timer = setTimeout(function () {
    timedOut = true;
    test.kill();
  },testTimeout);
}

function doNextTest(connectionString) {
  if (files.length) {
    var testFile = files.shift();

    doTest(testFile, connectionString);
  }
  else {
    //we're done with this connection string, display results and exit accordingly
    doNextConnectionString();
  }
}

function doNextConnectionString() {
  if (connectionStrings.length) {
    var connectionString = connectionStrings.shift();

    if (requestedTest) {
      files = [requestedTest];
    }
    else {
      //re-read files
      files = fs.readdirSync("./");

      files = files.filter(function (file) {
        return (/^test-/.test(file)) ? true : false;
      });

      files.sort();
    }

    doNextTest(connectionString);
  }
  else {
    if (errorCount) {
      console.log("\nResults : %s of %s tests failed.\n", errorCount, testCount);
      process.exit(errorCount);
    }
    else {
      console.log("Results : All tests were successful.");
    }
  }
}
