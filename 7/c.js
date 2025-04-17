const { Builder, By, until } = require('selenium-webdriver');
const XLSX = require('xlsx');

async function checkAttachments() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        // Read the Excel file
        const workbook = XLSX.readFile('C:\\Users\\mkale\\Downloads\\dump\\operation code\\test2.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: ['Case No', 'Has Attachment'] });

        // Login to the website
        await driver.get('https://jiocentral.jioconnect.com');
        await driver.wait(until.elementLocated(By.name('username')), 10000);
        await driver.findElement(By.name('username')).sendKeys('Mahendra1.kale');
        await driver.findElement(By.name('password')).sendKeys('Shamrao84');
        await driver.findElement(By.css('input[type="submit"]')).click();

        await driver.sleep(30000);
        // Navigate to QSYS page
        await driver.get('https://jiocentral.jioconnect.com/qsys');
        await driver.wait(until.elementLocated(By.css('.query-list-table')), 20000);
        try {
            // Select "All Available Cases" from dropdown
            const dropdown = await driver.findElement(By.id('asQ'));
            await dropdown.click();
            const allAvailableCasesOption = await driver.findElement(By.css('#asQ option[value="1"]'));
            await allAvailableCasesOption.click();
            await driver.sleep(2000);
        } catch (error) {
            console.log('Solved": ', error);
        }
        // Process each ticket
        for (let row of data) {
            if (row['Case No']) {
                try {
                    // Find the input field and enter the Case No
                    const caseInput = await driver.wait(until.elementLocated(By.id('caseNoQ')), 2000);
                    await caseInput.clear();
                    await caseInput.sendKeys(row['Case No']);

                    // Click the "View Cases" button
                    const viewButton = await driver.findElement(By.xpath("//button[@type='submit' and contains(text(), 'View Cases')]"));
                    await viewButton.click();

                    // Wait for the table to load and refresh
                    await driver.sleep(2000);
                    await driver.wait(until.elementLocated(By.css('.query-list-table table')), 10000);

                    // Try different methods to find the case row
                    let caseRow;
                    try {
                        // Method 1: Direct link search
                        caseRow = await driver.findElement(By.xpath(`//a[contains(text(), '${row['Case No']}')]/ancestor::tr`));
                    } catch (error) {
                        try {
                            // Method 2: Search in table cells
                            caseRow = await driver.findElement(By.xpath(`//tr[.//td[contains(text(), '${row['Case No']}')]]`));
                        } catch (error) {
                            // Method 3: Refresh and retry
                            await driver.navigate().refresh();
                            await driver.sleep(2000);
                            caseRow = await driver.findElement(By.xpath(`//a[contains(text(), '${row['Case No']}')]/ancestor::tr`));
                        }
                    }

                    // Click on the case number link to open the case
                    const caseLink = await caseRow.findElement(By.xpath('.//td[1]/a'));
                    await caseLink.click();

                    // Get all window handles and switch to the new tab
                    const allHandles = await driver.getAllWindowHandles();
                    const newTabHandle = allHandles[1];
                    await driver.switchTo().window(newTabHandle);

                    // Wait for page to load completely
                    await driver.sleep(2000);

                    // Check for attachments using multiple methods
                    try {
                        // Method 1: Check for the Attachments header
                        const attachmentHeader = await driver.findElement(By.xpath("//div[contains(@class, 'col-xs-6')]//b[text()='Attachments']"));
                        row['Has Attachment'] = 'Yes';
                    } catch (error) {
                        try {
                            // Method 2: Check for any attachment links
                            const attachmentLinks = await driver.findElements(By.xpath("//a[contains(@href, 'downloadAttachment')]"));
                            if (attachmentLinks.length > 0) {
                                row['Has Attachment'] = 'Yes';
                            } else {
                                row['Has Attachment'] = 'No';
                            }
                        } catch (error) {
                            row['Has Attachment'] = `Error: ${error.message}`;
                        }
                    }

                    // Close the current tab and switch back to the main tab
                    await driver.close();
                    const mainHandles = await driver.getAllWindowHandles();
                    await driver.switchTo().window(mainHandles[0]);

                } catch (error) {
                    // Store the actual error message
                    row['Has Attachment'] = `Error: ${error.message}`;
                }
            }
        }

        // Write the updated data back to Excel
        const newWorksheet = XLSX.utils.json_to_sheet(data);
        workbook.Sheets[sheetName] = newWorksheet;
        XLSX.writeFile(workbook, 'C:\\Users\\mkale\\Downloads\\dump\\operation code\\test2.xlsx');

    } catch (error) {
        console.log(`An error occurred: ${error.message}`);
    } finally {
        await driver.quit();
    }
    endTime = Date.now();
    // console.log(startTime);cd 8
    // console.log(endTime);
    console.log(`Execution time: ${(endTime - startTime) / 60000}ms`);
}


const startTime = Date.now();
let endTime;
checkAttachments();




