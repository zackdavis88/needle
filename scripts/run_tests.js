import Mocha from "mocha";
import fs from "fs";
import mongoose from "mongoose";
import { 
  dbHost,
  dbPort,
  dbName,
  options 
} from "../config/db";
const databaseUrl = `mongodb://${dbHost}:${dbPort}/${dbName}`;

// Instantiate a Mocha instance.
const mocha = new Mocha();
const rootTestDir = "test"

// Helper function that will return a full-path for all .spec.js files of a given folder.
const getFolderFiles = (folder) => {
  const folderPath = `${rootTestDir}/${folder}`;
  const testFiles =  fs.readdirSync(folderPath).reduce((prev, file) => {
    return file.endsWith(".spec.js") ? (
      prev.concat(`${folderPath}/${file}`)
    ) : (
      prev
    );
  }, []);

  return testFiles;
};

// Connect to the database so we can read/write during tests.
mongoose.connect(databaseUrl, options);
mongoose.connection.once("open", () => {
  // Generate a list of full-path test files.
  const testFiles = fs.readdirSync(rootTestDir).reduce((prev, item) => {
    if(!item.endsWith(".js"))
      return prev.concat(getFolderFiles(item));
    
    if(item.endsWith(".spec.js"))
      return prev.concat(`${rootTestDir}/${item}`);
    
    return prev;
  }, []);

  // Add the test file to the mocha instance.
  testFiles.forEach((file) => {
    mocha.addFile(file);
  });
  
  // Run the tests.
  mocha.run(function(failures) {
    // Disconnect from the database.
    mongoose.disconnect();
    // Exit with non-zero status if there were failures
    process.exitCode = failures ? 1 : 0;
  });
});
