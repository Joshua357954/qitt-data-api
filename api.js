const puppeteer = require('puppeteer');
const express = require('express')

const router = express.Router()
require("dotenv").config();

// 20233015854ff

router.get("/user/:reg_number",async(req,res) => {
	const ExecPath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
	const { reg_number } = req.params
	// 'C:/Program Files/Google/Chrome/Application/chrome.exe'

	const browser = await puppeteer.launch({
		args: ['--no-sandbox','--disable-setuid-sandbox','--single-process','--no-zygote'],
        executablePath: process.env.NODE_ENV === 'production' ? 
        				process.env.PUPPETEER_EXECUTABLE_PATH :
        				ExecPath,
        ignoreDefaultArgs: ["--hide-scrollbars"],
        headless:true,
        timeout: 6000 
    });
	
	try{
 	    const page = await browser.newPage();

	    // Configure the navigation timeout
	    await page.setDefaultNavigationTimeout(0);

	    // const reg_number = '202211365209BA'|| '202210955032DF' || '202210544502CA' || '202210395974EF' || '202210336710GA'|| '202210541317IA' ||  '202210955032DF'

	    const website = 'https://aris.uniport.edu.ng/admissionregistration'


	    // puppeteer workflows
	    await page.goto(website);

	    await page.type('#RegNo',reg_number)

	    const button = await page.waitForSelector('.btn')

	    await button.click();

	    await page.waitForSelector('#studentImg img');


	    // All labels
	    const all_labels = await page.$$eval('label', labels => {
	        return [...labels].map((label) => label.innerHTML)
	    })


	    const data_form_names = {
	        'admission_info':'frmAdmissionRegX',
	        'contact_info': 'frmAdmissionRegCI',
	        'parents_info': 'frmAdmissionRegParentsInfo',
	        'next_of_kin_info': 'frmAdmissionRegNKInfo',
	        'picture': 'studentImg'
	    }


	    // Convert string to camelcase
	    function ToCamelCase(text='hi') {
	        const cleanedText = text.replace(/[^a-zA-Z0-9 ]/g, ''); // Remove unwanted characters
	        const words = cleanedText.split(' ');
	        const camelCaseWords = words.map((word, index) => {
	            if (index === 0) return word.toLowerCase();
	            else return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	          })
	        return camelCaseWords.join('');
	    }


	    const User_Data =  Object.keys(data_form_names).map(async(section) => {
	        // get the main section classes
	        const form_class = data_form_names[section]

	        const extracted = await page.$$eval(`form[name="${form_class}"]`, (form_data) => {
	            
	            // convert string to camelcase
	            function ToCamelCase(text='word') {
	                const cleanedText = text.replace(/[^a-zA-Z0-9 ]/g, ''); // Remove unwanted characters
	                const words = cleanedText.split(' ');
	                const camelCaseWords = words.map((word, index) => {
	                    if (index === 0) return word.toLowerCase();
	                    else return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	                  })
	                return camelCaseWords.join('');
	            }

	            return form_data.map((fd) => {
	                let labels = Array.from(fd.querySelectorAll('label'))

	                let inputs = Array.from(fd.querySelectorAll('input'))
	                let pure_inputs = inputs.filter(item => item.name !== 'admissionID' )

	                const mappedData = {}

	                labels.forEach((label,index) => {
	                	console.log(label.name)
	                    const labelText = ToCamelCase(label.innerHTML.trim())
	                    const inputValue = pure_inputs[index].value

	                    mappedData[labelText] = inputValue
	                })

	                return mappedData
	            })
	        } )
	        
	        return extracted

	        })


	    // Personal info
	    const personal_info = await page.$eval('form[name="frmAdmissionRegPI"]', data => {
	        
	        const get_input = (secondElement) => {
	            
	            let value;
	            const selectElement = secondElement.querySelector('select');
	            const inputElement = secondElement.querySelector('input');

	            if (selectElement)
	              value = selectElement.innerHTML.split('>')[1].split('<')[0].trim();
	            
	            else if (inputElement)
	              value = inputElement.value.trim();
	            
	            else 
	              value = secondElement.textContent.trim();

	            return value
	        }


	        // convert string to camelcase
	        function ToCamelCase(text='word') {
	            const cleanedText = text.replace(/[^a-zA-Z0-9 ]/g, ''); // Remove unwanted characters
	            const words = cleanedText.split(' ');
	            const camelCaseWords = words.map((word, index) => {
	                if (index === 0) return word.toLowerCase();
	                else return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	              })
	            return camelCaseWords.join('');
	        }


	        const pi_merged = {}

	        Array.from(data.querySelectorAll('.form-group')).slice(0,5).forEach((fg) => {
	            const labels = Array.from(fg.querySelectorAll('label'))
	            const inputs = Array.from(fg.querySelectorAll('.col-lg-4'))

	            const l1 = ToCamelCase(labels[0].innerText.trim())
	            const l2 = ToCamelCase(labels[1].innerText.trim())
	           
	            pi_merged[l1] = get_input(inputs[0])
	            pi_merged[l2] = get_input(inputs[1])
	        })
	        return pi_merged
	    })


	    // image
	    const image = { 'picture' : await page.$eval('#studentImg img', img => img.src) }
	    
	    const passwordValue = await page.$eval('input[type="password"]', (input) => input.value);


	    // Merge Objects
	    const all_data = await Promise.all(User_Data)
	    const merged_all_data = all_data.reduce((acc, arr) => {
	      const obj = arr[0];
	      Object.assign(acc, obj);
	      return acc;
	    }, {});


	    // Prettified data
	    const PersonalData = Object.assign({},...[merged_all_data,personal_info,image])
	    console.log(PersonalData)

	    const pds = JSON.stringify(PersonalData,null,4)
	    
	    return res.status(200).json(pds) 

	 
	    // const fs = require('fs') 
	    // fs.writeFile (`./csc/aris${reg_number}.json`, JSON.stringify(PersonalData,null,4), function(err) {
	    //     if (err) throw err;
	    //     console.log('complete'); 
	    // })
	}

	catch(e){
		console.log("An Error Occured : ",e)
		return res.send(false)
	}

	finally{
		browser.close()
	}


	// res.json("Hey , Joshua")
	// res.send("My User Josh !!!")


})


module.exports = router

