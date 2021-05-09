const fs = require('fs');
const puppy = require('puppeteer');
const request = require('request');
const {parse, stringify} = require('flatted');

let input ="";
try {
    const jsonString = fs.readFileSync('./input.json')
    input = JSON.parse(jsonString)
  } catch(err) {
    console.log(err)
    return
  }

const jobsearch = input.searchBar;
const loc = "india";
const datePosted = input.datePosted;
const isremote = input.isRemote;
const jobType = input.jobType;


let jobsOnPage = "";

async function main(){

    let browser = await puppy.launch({
        headless:false,
        defaultViewport:false,
        slowMo:10,
    });

    let tabs = await browser.pages();
    let tab = tabs[0];

    await tab.goto("https://www.indeed.com/");
    
    await tab.waitForSelector("input[aria-labelledBy='label-text-input-what text-input-what-helpText']",{visible:true});
    await tab.type("input[aria-labelledBy='label-text-input-what text-input-what-helpText']", jobsearch);

    
    
    await tab.waitForSelector('input[aria-labelledby="label-text-input-where text-input-where-helpText"]',{visible:true});
    await tab.type('input[aria-labelledby="label-text-input-where text-input-where-helpText"]', loc);

    
    await tab.waitForSelector(".icl-Button.icl-Button--primary.icl-Button--md.icl-WhatWhere-button", {visible:true});
    await tab.click(".icl-Button.icl-Button--primary.icl-Button--md.icl-WhatWhere-button");

    //await tab.waitForNavigation({waitUntil:"networkidle2"});
    //date posted

    await filterByDate(datePosted, tab);


    await tab.waitForSelector('button[aria-label="Close"]', {visible:true});
    await tab.click('button[aria-label="Close"]');

    //filter by remote-menu
    await filterByRemoteMenu(isremote, tab);
    
    //filter by jobtype
    await filterByJobType(jobType, tab);


    
    await tab.waitForSelector(".jobsearch-SerpJobCard.unifiedRow.row.result");
    jobsOnPage = await tab.$$(".jobsearch-SerpJobCard.unifiedRow.row.result");

    await tab.waitForSelector(".jobsearch-SerpJobCard.unifiedRow.row.result .title a");
    let jobButton = await tab.$$(".jobsearch-SerpJobCard.unifiedRow.row.result .title a");
    
    //console.log(jobs.length);
    //let jobUrl = 
    let jobUrls = [];
    for(let i = 0; i < jobButton.length; i++)
    {
        let jobUrl = await tab.evaluate(function(ele)
        {
            return ele.getAttribute("href");
        }, jobButton[i]);

        jobUrls.push(jobUrl);
    }
    for(let i = 0; i < jobsOnPage.length; i++)
    {
        await checkJobInfo("https://www.indeed.com" + jobUrls[i], jobsOnPage[i], tab);
    }
}

let finalData = [];


async function checkJobInfo(jobUrl, jobNo, tab)
{
    
    await tab.goto(jobUrl);
    await tab.waitForSelector(".icl-u-xs-mb--xs.icl-u-xs-mt--none.jobsearch-JobInfoHeader-title");
    let position = await tab.$(".icl-u-xs-mb--xs.icl-u-xs-mt--none.jobsearch-JobInfoHeader-title");
    let innerTextOfPos = await tab.evaluate(position => position.textContent, position);
    
    
    //console.log(innerTextOfPos);

    let companyName = await tab.$(".icl-u-lg-mr--sm.icl-u-xs-mr--xs");
    let innerTextOfCompany = await tab.evaluate(companyName => companyName.textContent, companyName);
    
    //console.log(innerTextOfCompany);

    let jobdetails = await tab.$$(".icl-u-xs-mt--xs.icl-u-textColor--secondary.jobsearch-JobInfoHeader-subtitle.jobsearch-DesktopStickyContainer-subtitle > div");
    //console.log(jobdetails.length);
    let locationOfJob = jobdetails[1];
    let innerTextOfLoc = await tab.evaluate(locationOfJob => locationOfJob.textContent, locationOfJob);
    
    //console.log(innerTextOfLoc);

    let jobType = jobdetails[2];
    let innerTextOfJobType = await tab.evaluate(jobType => jobType.textContent, jobType);
    
    //console.log(innerTextOfJobType);


    let jobDescriptionAndOtherPts = await tab.$$(".jobsearch-jobDescriptionText > ul > li");
    let allImpPts = []
    for(let i = 0; i < jobDescriptionAndOtherPts.length; i++)
    {
        let innerTextOfJD = await jobDescriptionAndOtherPts[i].getProperty('innerText');
        //let finaltext = await innerTextOfJD.jsonValue();
        allImpPts.push(innerTextOfJD);
    }
    stringify(allImpPts);
    


    let otherImpDetails = await tab.$$(".jobsearch-jobDescriptionText > p")
    let innertextOfOtherDetails = []
    for(let i = 0; i < otherImpDetails.length; i++)
    {
        let innertxtOfOtherDetails = await otherImpDetails[i].getProperty('innerText');
        //let finaltxt = await innertxtOfOtherDetails.jsonValue();
        innertextOfOtherDetails.push(innertxtOfOtherDetails);
    }
    stringify(innertextOfOtherDetails);
    

    
    const args = allImpPts.map((jsHandle) => {
        const remoteObject = jsHandle[`_remoteObject`];
        if (allImpPts === undefined || remoteObject === undefined || jsHandle === undefined) { return undefined;} // return undefined for undefined 
        if (allImpPts === null || remoteObject === null ||jsHandle === null) { return null;} // null unchanged
        
        if(Object.prototype.hasOwnProperty.call(remoteObject, `value`)){
            return remoteObject.value;
        }
        else if(remoteObject.type === `object` && remoteObject.subtype === `error` && remoteObject.description){
            const errStack = remoteObject.description;
            const errMessage = errStack.split(`\n`)[0];
            const err = new Error(errMessage);
            err.stack = errStack;
            return err;
            
        }
        return remoteObject;
    });

    const args1 = innertextOfOtherDetails.map((jsHandle) => {
        
        const remoteObject = jsHandle[`_remoteObject`];
        if (allImpPts === undefined || remoteObject === undefined || jsHandle === undefined) { return undefined;} // return undefined for undefined 
        if (allImpPts === null || remoteObject === null || jsHandle === null) { return null;} // null unchanged

        if(Object.prototype.hasOwnProperty.call(remoteObject, `value`)){
            return remoteObject.value;
        }
        else if(remoteObject.type === `object` && remoteObject.subtype === `error` && remoteObject.description){
            const errStack = remoteObject.description;
            const errMessage = errStack.split(`\n`)[0];
            const err = new Error(errMessage);
            err.stack = errStack;
            return err;
            
        }
        return remoteObject;
    });
    

    finalData.push(
        {
            "position" : innerTextOfPos,
            "companyName" : innerTextOfCompany,
            "jobLoc" : innerTextOfLoc,
            "jobType" : innerTextOfJobType,
            //"jobLink" : "https://in.indeed.com/"+ link,
            "jobDescription1" : args,
            "jobDescription2" : args1
            
        }
    )
    if(finalData.length == jobsOnPage.length)
    fs.writeFileSync("finalData.JSON",JSON.stringify(finalData));

}

let num = ""
let jobSearchName = jobsearch.split(' ');
let jobname = '';
for(let i = 0; i < jobSearchName.length; i++)
{   
    if(i == jobSearchName.length-1)
    {
        jobname += jobSearchName[jobSearchName.length-1];
    }
    else jobname += jobSearchName[i] + '+';
}
async function filterByDate(datePosted, tab)
{
    //await tab.waitForNavigation({waitUntil:'networkidle2'});

    await tab.waitForSelector('button[aria-controls="filter-dateposted-menu"]', {visible:true});
    await tab.click('button[aria-controls="filter-dateposted-menu"]');
    
    
    if(datePosted === "")
    {
        return;
    }
    else if(datePosted === "Last 24 hours")
    {
        await tab.waitForSelector("a[href='/jobs?q="+jobname+"&l=india&fromage=1']", {visible:true});
        await tab.click("a[href='/jobs?q="+jobname+"&l=india&fromage=1']");
        num = '1'
    }
    else if(datePosted === "Last 3 days")
    {
        await tab.waitForSelector("a[href='/jobs?q="+jobname+"&l=india&fromage=3']", {visible:true});
        await tab.click("a[href='/jobs?q="+jobname+"&l=india&fromage=3']");
        num = '3'
    }
    else if(datePosted === "Last 7 days")
    {
        await tab.waitForSelector("a[href='/jobs?q="+jobname+"&l=india&fromage=7']", {visible:true});
        await tab.click("a[href='/jobs?q="+jobname+"&l=india&fromage=7']");
        num = '7'
    }
    else if(datePosted === "Last 14 days")
    {
        await tab.waitForSelector("a[href='/jobs?q="+jobname+"&l=india&fromage=14']",{visible:true});
        await tab.click("a[href='/jobs?q="+jobname+"&l=india&fromage=14']");
        num = '14'
    }
}
let remotejobid ="";
async function filterByRemoteMenu(isremote, tab)
{

    await tab.waitForSelector('button[aria-controls="filter-remote-menu"]', {visible:true});
    await tab.click('button[aria-controls="filter-remote-menu"]');
    //await tab.waitForNavigation({waitUntil:'networkidle2'});
    if(isremote === "")
    {
        return;
    }
    else if(isremote === "Remote")
    {
        await tab.waitForSelector('a[href="/jobs?q='+jobname+'&l=india&fromage=' + num +'&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11"]',{visible:true});
        await tab.click('a[href="/jobs?q='+jobname+'&l=india&fromage='+ num +'&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11"]');
        remotejobid = '032b3046-06a3-4876-8dfd-474eb5e7ed11';
    }
    else if(isremote === "Temporarily Remote")
    {
        await tab.waitForSelector('a[href="/jobs?q='+jobname+'&l=india&fromage='+ num + '&remotejob=7e3167e4-ccb4-49cb-b761-9bae564a0a63"]', {visible:true});
        await tab.click('a[href="/jobs?q='+jobname +'&l=india&fromage='+ num + '&remotejob=7e3167e4-ccb4-49cb-b761-9bae564a0a63]"');
        remotejobid = '7e3167e4-ccb4-49cb-b761-9bae564a0a63';
    }
}

async function filterByJobType(jobType, tab)
{
    await tab.waitForSelector('button[aria-controls="filter-job-type-menu"]', {visible:true});
    await tab.click('button[aria-controls="filter-job-type-menu"]');
    //await tab.waitForNavigation({waitUntil:'networkidle2'});

    if(jobType === "Full-Time")
    {
        await tab.waitForSelector('a[href="/jobs?q='+ jobname+'&l=india&jt=fulltime&fromage='+num+'&remotejob='+ remotejobid+'"]', {visible:true});
        await tab.click('a[href="/jobs?q='+jobname+'&l=india&jt=fulltime&fromage='+num+'&remotejob='+ remotejobid+'"]');
    }
    else if(jobType === "Internship")
    {
        await tab.waitForSelector('a[href="/jobs?q='+ jobname +'&l=india&jt=internship&fromage='+num+'&remotejob='+ remotejobid+'"]', {visible:true});
        await tab.click('a[href="/jobs?q='+ jobname +'&l=india&jt=internship&fromage='+num+'&remotejob='+ remotejobid+'"]');
    }
    else if(jobType === "Contract")
    {
        await tab.waitForSelector('a[href="/jobs?q='+ jobname+'&l=india&jt=contract&fromage='+num+'&remotejob='+ remotejobid+'"]', {visible:true});
        await tab.click('a[href="/jobs?q='+jobname+'&l=india&jt=contract&fromage='+num+'&remotejob='+ remotejobid+'"]');
    }
    else if(jobType === "Part Time")
    {
        await tab.waitForSelector('a[href="/jobs?q='+jobname+'&l=india&jt=parttime&fromage='+num+'&remotejob='+ remotejobid+'"]',{visible:true});
        await tab.click('a[href="/jobs?q=software+engineer&l=india&jt=parttime&fromage='+num+'&remotejob='+ remotejobid+'"]');
    }
    else if(jobType === "Fresher")
    {
        await tab.waitForSelector('a[href="/jobs?q='+jobname+'&l=india&jt=new_grad&fromage='+num+'&remotejob='+ remotejobid+'"]',{visible:true});
        await tab.click('a[href="/jobs?q='+jobname+'&l=india&jt=new_grad&fromage='+num+'&remotejob='+ remotejobid+'"]');
    }
    else if(jobType === "Temporary")
    {
        await tab.waitForSelector('a[href="/jobs?q='+jobname+'&l=india&jt=temporary&fromage='+num+'&remotejob='+ remotejobid+'"]',{visible:true});
        await tab.click('a[href="/jobs?q='+jobname+'&l=india&jt=temporary&fromage='+num+'&remotejob='+ remotejobid+'"]');
    }
    else if(jobType === "")
    {
        return;
    }
}

main();