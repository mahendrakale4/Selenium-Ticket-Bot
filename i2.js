
// const username = 'Yash.Dhawane';
// const password = 'Ticket@10';
const username = 'Mahendra1.kale';
const password = 'Shamrao@84';

const { Builder, By, until } = require('selenium-webdriver');
// const tickets = require('./lr.json');
const tickets = require('./no.json');

async function scrollIntoView(driver, element) {
    await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element);
    await driver.sleep(500);
}

async function clickButtonWhenAvailable(driver, xpath, timeout = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            let button = await driver.findElement(By.xpath(xpath));
            await scrollIntoView(driver, button);
            await driver.wait(until.elementIsVisible(button), 10000);
            await driver.wait(until.elementIsEnabled(button), 10000);
            await button.click();
            console.log("save");
            return true;
        } catch {
            await driver.sleep(500);
        }
    }
    return false;
}

async function processTicket(driver, ticket) {
    if (!ticket["Case No"]) return;
    console.log(`Processing ticket: ${ticket["Case No"]}`);
    await driver.wait(until.elementLocated(By.id('caseNoQ')), 2000);
    let caseInput = await driver.findElement(By.id('caseNoQ'));
    await caseInput.clear();
    await caseInput.sendKeys(ticket["Case No"]);
    await driver.findElement(By.xpath("//button[@type='submit' and contains(text(), 'View Cases')]")).click();
    await driver.wait(until.elementLocated(By.css('.query-list-table table')), 20000);

    try {
        let caseRow = await driver.findElement(By.xpath(`//a[contains(text(), '${ticket["Case No"]}')]/ancestor::tr`));
        let assignmentStatus = await caseRow.findElement(By.xpath('.//td[7]')).getText();
        if (assignmentStatus === 'Assigned to State Resolver') {
            await caseRow.findElement(By.xpath('.//td[1]/a')).click();
            let allHandles = await driver.getAllWindowHandles();
            await driver.switchTo().window(allHandles[1]);
            if (await clickButtonWhenAvailable(driver, "//input[@class='btn btn-primary btnAssignToMe']")) {
                await driver.close();
                await driver.switchTo().window(allHandles[0]);
            }
            console.log(`totalAssign = ${totalAssign++} `);
        } else {
            console.log(`Case ${ticket["Case No"]} cann't assign to me.`);
        }
    } catch (error) {
        console.log(`Case ${ticket["Case No"]} not found or error occurred: ${error.message}`);
    }
}
let totalAssign = 1;

async function main() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('https://jiocentral.jioconnect.com');
        await driver.wait(until.elementLocated(By.name('username')), 10000);

        await driver.findElement(By.name('username')).sendKeys(username);
        await driver.findElement(By.name('password')).sendKeys(password);
        await driver.findElement(By.css('input[type="submit"]')).click();
        await driver.get('https://jiocentral.jioconnect.com/qsys');
        await driver.wait(until.elementLocated(By.css('.query-list-table')), 20000);

        let dropdown = await driver.findElement(By.id('asQ'));
        await dropdown.click();
        await driver.findElement(By.css('#asQ option[value="3"]')).click();
        await driver.wait(until.elementLocated(By.css('.query-list-table tbody tr')), 2000);

        for (let ticket of tickets) {
            await processTicket(driver, ticket);
        }
    } catch (error) {
        console.log(`An error occurred: ${error.message}`);
    } finally {
        await driver.quit();
    }
}

main();