// Import necessary modules
const data =require( './data.json')
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Mailto = require('./nodeMailer');

// Create an Express app
const app = express();
app.use(cors());
const port = 3009;

let accessToken = ''; 
const parseUrlEncodedData = express.urlencoded({ extended: true });

// Middleware for the '/createDraft' endpoint to parse JSON data
const parseJsonData = express.json();
// Define a route to call the third-party API


app.post('/getToken',parseUrlEncodedData, async (req, res) => {
  try {
    console.log("the req body is",req?.body);
    // Make a GET request to the third-party API
    const response = await axios.post('https://uat.rwaapps.net:8888/oauth2/token',req.body,{
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    // console.log("the data is ",response);
    accessToken=response?.data?.access_token
    // Return the response from the third-party API
    res.json(response.data);
  } catch (error) {
    // If an error occurs, return an error message
    console.error('Error calling API:', error);
    res.status(500).json({ error: 'Error calling API' });
  }
});


app.post('/mccaliases',parseJsonData, async (req, res) => {
  try{
    console.log(req.body,"Data getting from front end for aliases");
    const response = await axios.get('https://uat.rwaapps.net:8888/v1/boarding/configurations/mcc-aliases',{
      headers: {
        'Authorization': `Bearer ${req.body.token}`
      }});
    // console.log("Response Data for mcc-aliases",response);
    res.json(response.data);
  }
  catch(error) {
    console.error('Error calling API:', error?.response);
    res.status(500).json({ error: 'Error calling API' });
  }
});



app.post('/createDraft', parseJsonData,async (req, res) => {
    try {
      console.log("the req body is",req?.body?.businessInformation?.businessEmail);
      const personEmail=req?.body?.businessInformation?.businessEmail;
      // Make a GET request to the third-party API
      const response = await axios.post('https://uat.rwaapps.net:8888/v1/boarding/applications/submit',req.body,{
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }})
      if(response)
      {
        console.log('personal email',personEmail);
        Mailto(`<div><h3>Congratulations you are onboarded to our platform as a merchant.
        Please click the link to sign the required document</h3>
       <link href='${response?.data?.urlForSigning}'>${response?.data?.urlForSigning}</link>
        </div>`,false,[],personEmail)
      }
      // Return the response from the third-party API
      res.json(response.data);
    } catch (error) {
      // If an error occurs, return an error message
      console.error('Error calling API:', error?.response);
      res.status(500).json({ error: 'Error calling API' });
    }
  });



  app.get('/countries',async (req, res) => {
    console.log("the data uis",data);
const countries=[];
try{
  for(country of data)
  {
    console.log("tge data uis",country?.name);
    countries.push({
      name:country?.name,
      iso2:country?.iso2
    })
  }
  console.log("going to send",countries.length);
  res.json(countries);
}catch(err)
{
  return "Unable to get countries"
}



  });
  app.post('/state',parseJsonData,async (req, res) => {
    console.log("the data is",req?.body?.country);

    const temp=data.filter((item)=>item?.name===req?.body?.country)  
      if(temp&& temp.length!==0)
      {
    console.log("The temo uis",temp[0]?.states);
    const states=[];
    for(state of temp[0]?.states)

    {
      states.push({
        name:state?.name,
        iso2:state?.state_code
      })
    }
    res.json(states);
  }
  else
  {
    res.json("nothing found");
  }
  });



  app.post('/cities',parseJsonData,async (req, res) => {
    console.log("the req body is",req?.body);
   const tempCities=data.filter((item)=>item?.name===req?.body?.country)
   if(tempCities && tempCities.length!==0)
   {
    const stateCheck=tempCities[0]?.states.filter((item)=>item?.name===req?.body?.state)
    if(stateCheck && stateCheck.length!==0)
    {
      console.log("the dataa iss",stateCheck);
      const Cities=[];
      for(city of stateCheck[0]?.cities)
      {
        Cities.push(city?.name)
      }

      res.json(Cities);

    }
    else
    {
      res.json("No Cities for this State");

    }
   }
   else
   {
    res.json("No state for this country");
   }

  });



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

