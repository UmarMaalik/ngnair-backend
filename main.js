// Import necessary modules
const data = require("./data.json");
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const Mailto = require("./nodeMailer");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const generateRandomString = require("./utils");

// Create an Express app


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer();
const port = 3009;

let accessToken = "";

// Middleware for the '/createDraft' endpoint to parse JSON data
const parseJsonData = express.json();
// Define a route to call the third-party API

app.post("/getToken", async (req, res) => {
  try {
    const response = await axios.post(
      "https://uat.rwaapps.net:8888/oauth2/token",
      req.body,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    accessToken = response?.data?.access_token;
    res.json(response.data);
  } catch (error) {
    console.error("Error calling API:", error);
    res.status(500).json({ error: "Error calling API" });
  }
});

app.post("/mccaliases", async (req, res) => {
  try {
    const response = await axios.get(
      "https://uat.rwaapps.net:8888/v1/boarding/configurations/mcc-aliases",
      {
        headers: {
          Authorization: `Bearer ${req.body.token}`,
        },
      }
    );
    // console.log("Response Data for mcc-aliases",response);
    res.json(response.data);
  } catch (error) {
    console.error("Error calling API:", error?.response);
    res.status(500).json({ error: "Error calling API" });
  }
});

app.post("/createDraft", async (req, res) => {
  try {

    const personEmail = req?.body?.businessInformation?.businessEmail;
    // Make a GET request to the third-party API
    const response = await axios.post(
      "https://uat.rwaapps.net:8888/v1/boarding/applications/submit",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (response) {
      console.log("personal email", personEmail);
      Mailto(
        `<div><h3>Congratulations you are onboarded to our platform as a merchant.
        Please click the link to sign the required document</h3>
       <link href='${response?.data?.urlForSigning}'>${response?.data?.urlForSigning}</link>
        </div>`,
        false,
        [],
        personEmail
      );
    }
    // Return the response from the third-party API
    res.json(response.data);
  } catch (error) {
    // If an error occurs, return an error message
    console.error("Error calling API:", error?.response);
    res.status(500).json({ error: "Error calling API" });
  }
});

app.post("/nmicreatemerchant", async (req, res) => {
  const randomString = generateRandomString(5);
  console.log("Random string",randomString);
  try {
    const options = {
      method: 'POST',
      url: 'https://secure.nmi.com/api/v4/merchants',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'v4_secret_xPewJM4nPs97TCQkxz88X637vw23DDpw' // Replace with your actual API key
      },
      data: {
        accountInfo: {
          checkAccount: '123123123',
          checkAba: '123123123',
          accountType: 'checking',
          accountHolderType: 'business'
        },
        language: 'en_US',
        phone: '555-555-5555',
        email: 'someone@example.com',
        lastName: 'Doe',
        firstName: 'Jane',
        timezone: 'America/Chicago',
        zip: '60601',
        state: 'IL',
        city: 'Chicago',
        address1: '123 Fake St.',
        country: 'US',
        company: 'ACME, Inc.',
        type: 'gateway',
        username: randomString // You can append a random string here if needed
      }
    };

    axios.request(options)
      .then(function (response) {
        console.log(response.data);
        res.status(200).json({ message: "Done with API, Success" });
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).json({ message: "Error occurred while processing the API request" });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An unexpected error occurred" });
  }
});

app.post("/documents", upload.any(), async (req, res) => {
  try {
    console.log("Request Body : ", req.body);
    console.log("Request files : ", req.files);
    let arr = []
    const AppId = req.body.AppID;

    const uploadDirectory = "public/";

    req.files?.map(async (uploadedFile, index)=>{
      
    const filename = `${uuidv4()}${req.files[index].originalname}`;

    const filePath = path.join(uploadDirectory, filename);
    console.log("Upload DS", filePath);

    fs.writeFileSync(filePath, req.files[index].buffer);

    const formData = new FormData();
    formData.append("Name", req.files[index].fieldname);
    formData.append("Type", req.files[index].fieldname);
    formData.append("File", fs.createReadStream(filePath));

    const response = await axios.post(
      `https://uat.rwaapps.net:8888/v1/boarding/applications/${AppId}/documents`,
      formData,
      {
        headers: {
          ...formData.getHeaders(), // Set appropriate headers for FormData
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    arr.push(response.data)
  })
  res.json(arr);


} catch (error) {
    console.error("Error calling API:", error);
    res.status(500).json(error);
  }
});

// app.post('/documents', upload.any(), async (req, res) => {
//   try{
//     // console.log("Documents API payload",req.body);
//     // console.log("Documents API payload APP ID",req.body.AppID);
//     console.log("Documents API payload",req.files);

//     const appId = req.body.AppID
//     const ApiPayLoad = {
//       Name : req.body.Name,
//       Type : req.body.Type,
//       File : req.files[0]
//     }

//     console.log("Payload : ",ApiPayLoad);

//     const response  = await axios.post(`https://uat.rwaapps.net:8888/v1/boarding/applications/29649/documents`, ApiPayLoad,
//     {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//         Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiZjliNDJiMGYtYmFhMC00MmE0LWFkZjctNmI3MzQ3N2Q1ZTAwIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiT3V0c2lkZSBBZ2VudCIsIkNvbXBhbnlJZCI6IjQxODkiLCJuYmYiOjE3MTMyNTk0OTUsImV4cCI6MTcxMzI2MzA5NSwiaXNzIjoiUmlzZUNSTS5Jc3N1ZXIiLCJhdWQiOiJSaXNlQ1JNLkF1ZGllbmNlIn0.xheIZeCbU4yWrwuaNsPYgKx0CqtgCKmEiTHwk0mj0_k`,
//       }
//     }
//     )
//     // console.log(response);
//     res.json(response.data)
//   }
//   catch(error){
//     console.error("Error calling API:", error);
//     res.status(500).json(error)
//   }
// })

app.get("/countries", async (req, res) => {
  console.log("the data uis", data);
  const countries = [];
  try {
    for (country of data) {
      console.log("tge data uis", country?.name);
      countries.push({
        name: country?.name,
        iso2: country?.iso2,
      });
    }
    console.log("going to send", countries.length);
    res.json(countries);
  } catch (err) {
    return "Unable to get countries";
  }
});

app.post("/state", async (req, res) => {
  console.log("the data is", req?.body?.country);

  const temp = data.filter((item) => item?.name === req?.body?.country);
  if (temp && temp.length !== 0) {
    console.log("The temo uis", temp[0]?.states);
    const states = [];
    for (state of temp[0]?.states) {
      states.push({
        name: state?.name,
        iso2: state?.state_code,
      });
    }
    res.json(states);
  } else {
    res.json("nothing found");
  }
});

app.post("/cities", async (req, res) => {
  console.log("the req body is", req?.body);
  const tempCities = data.filter((item) => item?.name === req?.body?.country);
  if (tempCities && tempCities.length !== 0) {
    const stateCheck = tempCities[0]?.states.filter(
      (item) => item?.name === req?.body?.state
    );
    if (stateCheck && stateCheck.length !== 0) {
      console.log("the dataa iss", stateCheck);
      const Cities = [];
      for (city of stateCheck[0]?.cities) {
        Cities.push(city?.name);
      }

      res.json(Cities);
    } else {
      res.json("No Cities for this State");
    }
  } else {
    res.json("No state for this country");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
