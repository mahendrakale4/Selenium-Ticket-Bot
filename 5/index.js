const { Builder, By, until } = require("selenium-webdriver");

// const tickets = require('./co.json');
// const tickets = require('./lr.json');
const tickets = require("./5.json");

async function main() {
  let driver = await new Builder().forBrowser("chrome").build();
  let totalResolve = 1;

  try {
    // Open the login page and log in
    await driver.get("https://jiocentral.jioconnect.com");
    await driver.wait(until.elementLocated(By.name("username")), 10000);
    await driver.findElement(By.name("username")).sendKeys("Mahendra1.kale");
    await driver.findElement(By.name("password")).sendKeys("Shamrao84");

    await driver.findElement(By.css('input[type="submit"]')).click();
    console.log("Logged in successfully.");
    
    await driver.sleep(20000);
    // Navigate to the QSYS page
    await driver.get("https://jiocentral.jioconnect.com/qsys");
    await driver.wait(until.elementLocated(By.css(".query-list-table")), 20000);
    console.log("Navigated to the QSYS page.");

    // Switch to "All Available Cases"
    try {
      let dropdown = await driver.findElement(By.id("asQ"));
      await dropdown.click();
      let allAvailableCasesOption = await driver.findElement(
        By.css('#asQ option[value="3"]')
      );
      await allAvailableCasesOption.click();
      console.log('Selected "All Available Cases" from the dropdown.');
      await driver.wait(
        until.elementLocated(By.css(".query-list-table tbody tr")),
        2000
      );
      console.log('Loaded "All Available Cases".');
    } catch (error) {
      console.log('Error switching to "All Available Cases": ', error);
    }

    // Loop through each ticket in the JSON data
    for (let ticket of tickets) {
      if (ticket["Case No"]) {
        console.log(`Processing ticket: ${ticket["Case No"]}`);

        // Find the input field and enter the Case No
        await driver.wait(until.elementLocated(By.id("caseNoQ")), 2000);
        let caseInput = await driver.findElement(By.id("caseNoQ"));
        await caseInput.clear();
        await caseInput.sendKeys(ticket["Case No"]);
        console.log(`Entered case number: ${ticket["Case No"]}`);

        // Click the "View Cases" button
        let viewButton = await driver.findElement(
          By.xpath(
            "//button[@type='submit' and contains(text(), 'View Cases')]"
          )
        );
        await viewButton.click();
        console.log("Clicked on View Cases button.");

        // await driver.sleep(3000);

        // Wait for the table to load with results
        await driver.wait(
          until.elementLocated(By.css(".query-list-table table")),
          20000
        );
        console.log("Table with case results loaded.");

        let caseRow;
        try {
          // Find the row with the specified case number
          let caseRow = await driver.findElement(
            By.xpath(
              `//a[contains(text(), '${ticket["Case No"]}')]/ancestor::tr`
            )
          );

          // Check the "Assignment Status" column (assuming it’s the 7th <td>)
          let assignmentStatus = await caseRow
            .findElement(By.xpath(".//td[7]"))
            .getText();
          console.log(
            `Assignment status for ${ticket["Case No"]}: ${assignmentStatus}`
          );

          if (assignmentStatus !== "Resolved") {
            // Click on the case number link to open the case
            let caseLink = await caseRow.findElement(By.xpath(".//td[1]/a"));
            await caseLink.click();
            console.log(`Opened unresolved case: ${ticket["Case No"]}`);

            // Get all window handles and switch to the new tab
            let allHandles = await driver.getAllWindowHandles();
            let newTabHandle = allHandles[1];
            await driver.switchTo().window(newTabHandle);
            console.log("Switched to the new tab.");

            // Helper function to click "Assign To Me" or "Resolve" when available
            async function clickButtonWhenAvailable(xpath, timeout = 10000) {
              const startTime = Date.now();
              while (Date.now() - startTime < timeout) {
                try {
                  const button = await driver.findElement(By.xpath(xpath));
                  await driver.wait(until.elementIsVisible(button), 1000);
                  await driver.wait(until.elementIsEnabled(button), 1000);
                  await button.click();
                  console.log(`Clicked button with xpath: ${xpath}`);
                  return true; // Success
                } catch (error) {
                  await driver.sleep(500); // Retry every 500ms if not found
                }
              }
              return false; // Failed to click within the timeout
            }

            // Helper function to scroll an element into view, ensuring it is fully visible in the middle of the screen
            async function scrollIntoView(element) {
              // Scroll to the element
              await driver.executeScript(
                "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
                element
              );
              await driver.sleep(500); // Wait after scrolling for smooth transition
            }

            // Helper function to click any button (either "Assign To Me" or "Resolve")
            async function clickButtonWhenAvailableDown(
              xpath,
              timeout = 10000
            ) {
              const startTime = Date.now();
              while (Date.now() - startTime < timeout) {
                try {
                  let button = await driver.findElement(By.xpath(xpath));

                  // Scroll the button into view
                  await scrollIntoView(button);
                  console.log(`Scrolled to button with xpath: ${xpath}`);

                  // Wait for the button to be visible and enabled
                  await driver.wait(until.elementIsVisible(button), 10000);
                  await driver.wait(until.elementIsEnabled(button), 10000);

                  // Click the button
                  await button.click();
                  console.log(`Clicked button with xpath: ${xpath}`);
                  return true; // Successfully clicked
                } catch (error) {
                  await driver.sleep(500); // Retry every 500ms if not found
                }
              }
              console.log(
                `Button with xpath ${xpath} not found within the timeout.`
              );
              return false; // Failed to click within timeout
            }

            // Check if "Assign To Me" button is available and click it
            let assignOrResolveHandled = await clickButtonWhenAvailableDown(
              "//input[@class='btn btn-primary btnAssignToMe']"
            );
            if (assignOrResolveHandled) {
              // After clicking "Assign To Me", close the current tab
              await driver.close();
              console.log('Closed current tab after clicking "Assign To Me".');

              // Switch back to the previous tab
              let allHandles = await driver.getAllWindowHandles();
              await driver.switchTo().window(allHandles[0]);
              console.log("Switched back to the original tab.");

              // Click on the same IM link again to open the ticket in a new tab
              let caseLinkAgain = await caseRow.findElement(
                By.xpath(".//td[1]/a")
              );
              await caseLinkAgain.click();
              console.log(
                `Opened the same case ${ticket["Case No"]} in a new tab.`
              );

              // Switch to the new tab
              let newHandles = await driver.getAllWindowHandles();
              let newTab = newHandles[1];
              await driver.switchTo().window(newTab);
              console.log("Switched to the newly opened tab.");

              // Click the "Resolve" button to resolve the ticket
              let resolveButton = await clickButtonWhenAvailableDown(
                "//button[@class='btn btn-primary btnResolve']"
              );
              // await resolveButton.click();
              console.log("Clicked Resolve button.");

              await driver.wait(
                until.elementLocated(By.css(".modal-dialog")),
                15000
              );

              await driver.sleep(3000);

              let categorySelect = await driver.findElement(
                By.id("categoryrv")
              );
              let caseResolutionSelect = await driver.findElement(
                By.id("caseResolutionrv")
              );
              let commentInput = await driver.findElement(By.id("commentrv"));

              // Select Case Category
              let categoryOptions = await categorySelect.findElements(
                By.tagName("option")
              );
              for (let option of categoryOptions) {
                if ((await option.getText()) === ticket["Case Category"]) {
                  await option.click();
                  break;
                }
              }

              // Select Case Resolution Category
              let caseResolutionOptions =
                await caseResolutionSelect.findElements(By.tagName("option"));
              for (let option of caseResolutionOptions) {
                if (
                  (await option.getText()) ===
                  ticket["Case Resolution Category"]
                ) {
                  await option.click();
                  break;
                }
              }

              // Enter Case Resolution Comments
              await commentInput.clear();
              await commentInput.sendKeys(ticket["Case Resolution Comments"]);

              await driver.sleep(1000);

              let saveButton = await driver.wait(
                until.elementLocated(
                  By.xpath("//button[contains(text(),'Save')]")
                ),
                15000
              );
              await saveButton.click();

              // console.log('Clicked Save button.')
              console.log(
                `--------------------------------------totalResolve = ${totalResolve++} `
              );

              await driver.sleep(1500);
              // After resolving the ticket, close the current tab
              await driver.close();
              console.log("Closed current tab after resolving ticket.");

              // Switch back to the main tab
              let mainHandles = await driver.getAllWindowHandles();
              await driver.switchTo().window(mainHandles[0]);
              console.log("Switched back to the main tab.");
            }

            // If "Resolve" button is available directly
            else {
              let resolveButton = await clickButtonWhenAvailableDown(
                "//button[@class='btn btn-primary btnResolve']"
              );
              // await resolveButton.click();
              console.log("Clicked Resolve button.");

              await driver.wait(
                until.elementLocated(By.css(".modal-dialog")),
                15000
              );

              await driver.sleep(3000);

              let categorySelect = await driver.findElement(
                By.id("categoryrv")
              );
              let caseResolutionSelect = await driver.findElement(
                By.id("caseResolutionrv")
              );
              let commentInput = await driver.findElement(By.id("commentrv"));

              // Select Case Category
              let categoryOptions = await categorySelect.findElements(
                By.tagName("option")
              );
              for (let option of categoryOptions) {
                if ((await option.getText()) === ticket["Case Category"]) {
                  await option.click();
                  break;
                }
              }

              // Select Case Resolution Category
              let caseResolutionOptions =
                await caseResolutionSelect.findElements(By.tagName("option"));
              for (let option of caseResolutionOptions) {
                if (
                  (await option.getText()) ===
                  ticket["Case Resolution Category"]
                ) {
                  await option.click();
                  break;
                }
              }

              // Enter Case Resolution Comments
              await commentInput.clear();
              await commentInput.sendKeys(ticket["Case Resolution Comments"]);

              await driver.sleep(1500);

              // Wait for the page to load and close the current tab
              await driver.wait(
                until.elementLocated(By.id("rvSaveBtn")),
                15000
              ); // Wait for the "Save" button with the correct ID
              console.log("Page loaded after clicking Resolve.");

              // Optionally, you can add a small sleep before clicking the "Save" button if needed
              await driver.sleep(1000); // Optional wait for a bit before clicking the button

              // Now, click the Save button using its ID
              let saveButton = await driver.findElement(By.id("rvSaveBtn"));
              await saveButton.click();
              // console.log('Clicked Save button.');
              console.log(
                `-                                                                totalResolve = ${totalResolve++} `
              );

              await driver.sleep(1500);

              // After resolving the ticket, close the current tab
              await driver.close();
              console.log("Closed current tab after resolving ticket.");

              // Switch back to the main tab
              let mainHandles = await driver.getAllWindowHandles();
              await driver.switchTo().window(mainHandles[0]);
              console.log("Switched back to the main tab.");
            }
          } else {
            console.log(`Case ${ticket["Case No"]} already resolved.`);
          }
        } catch (error) {
          console.log(
            `Case ${ticket["Case No"]} not found or error occurred: ${error.message}`
          );
        }
      }
    }
  } catch (error) {
    console.log(`An error occurred: ${error.message}`);
  } finally {
    await driver.quit();
  }
}

main();

// main.js
// ├── Import Dependencies
// │   ├── Builder from selenium - webdriver
// │   ├── By from selenium - webdriver
// │   └── until from selenium - webdriver
// │
// ├── tickets(JSON Data)
// │   └── tickets = require('./no.json')
// │
// ├── main function (async)
// │   ├── Create WebDriver instance(driver)
// │   ├── Log in to the website
// │   │   ├── Navigate to the login page
// │   │   ├── Wait for username field
// │   │   ├── Enter credentials
// │   │   └── Click the submit button
// │   │
// │   ├── Navigate to QSYS page
// │   │   ├── Wait for query list table
// │   │   └── Log message "Navigated to the QSYS page."
// │   │
// │   ├── Switch to "All Available Cases"
// │   │   ├── Click dropdown for case types
// │   │   ├── Select "All Available Cases" option
// │   │   └── Log message on successful selection
// │   │
// │   ├── Loop through each ticket in the JSON data
// │   │   └── For each ticket with a "Case No":
// │   │       ├── Wait for and clear the case number input field
// │   │       ├── Enter the Case No
// │   │       ├── Click the "View Cases" button
// │   │       ├── Wait for table to load with results
// │   │       └── Search for case row matching Case No
// │   │           ├── Check assignment status
// │   │           └── If unresolved, open the case in a new tab
// │   │               ├── Switch to the new tab
// │   │               ├── Define helper functions for interaction
// │   │               │   ├── clickButtonWhenAvailable(click buttons when available)
// │   │               │   ├── scrollIntoView(scroll element into view)
// │   │               │   └── clickButtonWhenAvailableDown(click buttons with retry)
// │   │               ├── Check "Assign To Me" or "Resolve" button
// │   │               ├── If "Assign To Me" button clicked
// │   │               │   ├── Close the tab and switch back to the original tab
// │   │               │   ├── Open the case again in a new tab
// │   │               │   └── Resolve the case with details from JSON
// │   │               ├── If "Resolve" button directly available
// │   │               │   ├── Resolve the case with details from JSON
// │   │               │   ├── Wait for modal to load
// │   │               │   ├── Fill form with category, case resolution, and comment
// │   │               │   ├── Click Save button
// │   │               │   └── Close the tab after saving
// │   │               └── Handle errors in case processing
// │   │
// │   └── Error Handling and Cleanup
// │       ├── Log any errors during the script execution
// │       └── Quit the driver after execution
// └── End of main function
