// Import necessary modules
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Mailto = require('./nodeMailer');

// Create an Express app
const app = express();
app.use(cors());
const port = 3005;

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
    console.log("the data is ",response);
    accessToken=response?.data?.access_token
    // Return the response from the third-party API
    res.json(response.data);
  } catch (error) {
    // If an error occurs, return an error message
    console.error('Error calling API:', error);
    res.status(500).json({ error: 'Error calling API' });
  }
});
app.post('/createDraft', parseJsonData,async (req, res) => {
    try {
    //   console.log("the req body is",req?.body?.businessInformation?.businessEmail);
      const personEmail=req?.body?.businessInformation?.businessEmail;
      // Make a GET request to the third-party API
      const response = await axios.post('https://uat.rwaapps.net:8888/v1/boarding/applications/submit',req.body,{
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }})
      console.log("the data is ",response?.data);
      if(response)
      {
        Mailto(`<div><h3>Congratulations you are onboarded to our platform as a merchant.
        Please click the link to sign the required document</h3>
       <link href='${response?.data?.urlForSigning}'>${response?.data?.urlForSigning}</link>
        </div>`,false,personEmail)
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
    try {
      console.log("the req body is",req);
      // Make a GET request to the third-party API
      const response = await axios.get('https://countriesnow.space/api/v0.1/countries/states')
      console.log("the data is ",response);
      
      // Return the response from the third-party API
      res.json(response.data);
    } catch (error) {
      // If an error occurs, return an error message
      console.error('Error calling API:', error);
      res.status(500).json({ error: 'Error calling API' });
    }
  });
  app.post('/cities',parseJsonData,async (req, res) => {
    try {
      console.log("the req body is",req);
      // Make a GET request to the third-party API
      const response = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities',req?.body)
      console.log("the data is ",response);
      
      // Return the response from the third-party API
      res.json(response.data);
    } catch (error) {
      // If an error occurs, return an error message
      console.error('Error calling API:', error?.response?.data);
      res.status(500).json({ error: 'Error calling API' });
    }
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

