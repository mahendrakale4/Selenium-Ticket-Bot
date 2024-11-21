const { Builder, By, until } = require('selenium-webdriver');

// const tickets = require('./co.json');
// const tickets = require('./lr.json');
const tickets = require('./no.json');

async function main() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('https://jiocentral.jioconnect.com');
        await driver.wait(until.elementLocated(By.name('username')), 10000);
        await driver.findElement(By.name('username')).sendKeys('Mahendra1.kale');
        await driver.findElement(By.name('password')).sendKeys('Shamrao@84');
        await driver.findElement(By.css('input[type="submit"]')).click();
        console.log('Logged in successfully.');
        await driver.get('https://jiocentral.jioconnect.com/qsys');
        await driver.wait(until.elementLocated(By.css('.query-list-table')), 20000);
        console.log('Navigated to the QSYS page.');

        // Switch to "All Available Cases"
        try {
            let dropdown = await driver.findElement(By.id('asQ'));
            await dropdown.click();
            let allAvailableCasesOption = await driver.findElement(By.css('#asQ option[value="3"]'));
            await allAvailableCasesOption.click();
            console.log('Selected "All Available Cases" from the dropdown.');
            await driver.wait(until.elementLocated(By.css('.query-list-table tbody tr')), 2000);
            console.log('Loaded "All Available Cases".');
        } catch (error) {
            console.log('Error switching to "All Available Cases": ', error);
        }

        // Loop through each ticket in the JSON data
        for (let ticket of tickets) {
            if (ticket["Case No"]) {
                console.log(`Processing ticket: ${ticket["Case No"]}`);

                // Find the input field and enter the Case No
                await driver.wait(until.elementLocated(By.id('caseNoQ')), 2000);
                let caseInput = await driver.findElement(By.id('caseNoQ'));
                await caseInput.clear();
                await caseInput.sendKeys(ticket["Case No"]);
                console.log(`Entered case number: ${ticket["Case No"]}`);

                // Click the "View Cases" button
                let viewButton = await driver.findElement(By.xpath("//button[@type='submit' and contains(text(), 'View Cases')]"));
                await viewButton.click();
                console.log('Clicked on View Cases button.');

                // Wait for the table to load with results
                await driver.wait(until.elementLocated(By.css('.query-list-table table')), 20000);
                console.log('Table with case results loaded.');

                let caseRow;
                try {

                    // Find the row with the specified case number
                    let caseRow = await driver.findElement(By.xpath(`//a[contains(text(), '${ticket["Case No"]}')]/ancestor::tr`));

                    // Check the "Assignment Status" column (assuming it’s the 7th <td>)
                    let assignmentStatus = await caseRow.findElement(By.xpath('.//td[7]')).getText();
                    console.log(`Assignment status for ${ticket["Case No"]}: ${assignmentStatus}`);

                    if (assignmentStatus === 'Assigned to State Resolver') {
                        // Click on the case number link to open the case
                        let caseLink = await caseRow.findElement(By.xpath('.//td[1]/a'));
                        await caseLink.click();
                        console.log(`Opened UN-assigned  case: ${ticket["Case No"]}`);

                        // Get all window handles and switch to the new tab
                        let allHandles = await driver.getAllWindowHandles();
                        let newTabHandle = allHandles[1];
                        await driver.switchTo().window(newTabHandle);
                        console.log('Switched to the new tab.');


                        //  FUNCTION 1-------------------------------------------
                        // Helper function to scroll an element into view, ensuring it is fully visible in the middle of the screen
                        async function scrollIntoView(element) {
                            // Scroll to the element
                            await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element);
                            await driver.sleep(500); // Wait after scrolling for smooth transition
                        }

                        //  FUNCTION 2------------------------------------------------------
                        // Helper function to click any button (either "Assign To Me" or "Resolve")
                        async function clickButtonWhenAvailableDown(xpath, timeout = 10000) {
                            const startTime = Date.now();
                            while (Date.now() - startTime < timeout) {
                                try {
                                    let button = await driver.findElement(By.xpath(xpath));

                                    // Scroll the button into view
                                    // calling FUNCTION 1------------------------------------

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
                            console.log(`Button with xpath ${xpath} not found within the timeout.`);
                            return false; // Failed to click within timeout
                        }

                        // calling FUNCTION 2------------------------------------------------------
                        // Check if "Assign To Me" button is available and click it
                        let assignOrResolveHandled = await clickButtonWhenAvailableDown("//input[@class='btn btn-primary btnAssignToMe']");
                        if (assignOrResolveHandled) {
                            // After clicking "Assign To Me", close the current tab
                            // MOVE TO Next Case No.
                            await driver.close();
                            console.log('Closed current tab after clicking "Assign To Me".');

                            // Switch back to the main tab
                            let mainHandles = await driver.getAllWindowHandles();
                            await driver.switchTo().window(mainHandles[0]);
                            console.log('Switched back to the main tab.');
                        }


                    } else {
                        console.log(`Case ${ticket["Case No"]} already resolved.`);
                    }
                } catch (error) {
                    console.log(`Case ${ticket["Case No"]} not found or error occurred: ${error.message}`);
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