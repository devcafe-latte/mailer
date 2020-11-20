import container from "./model/DiContainer";

(async () => {
  console.log("Processing Mailqueue...");
  try {
    await container.ready();
    const result = await container.mailer.processQueue();
    
    if (result.failures) {
      console.warn(`${result.failures} emails were unsuccessful.`);
    }
    console.log(`${result.successes} emails successfully sent.`);

    process.exit();
  } catch (err) {
    console.error(err);
    console.warn("Exiting with errors")
    process.exit(1);
  }
})();