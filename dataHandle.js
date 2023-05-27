const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const { connect } = require('http2');
const APIKEY = 'cb77b17e1c5b411397f185427232505';

// Create connection
const db = mysql.createConnection({
    host: 'containers-us-west-120.railway.app',
    user: 'root',
    password: '2LHYDggZDwzPkh0CDBmi',
    database: 'railway',
});

// Connect 
db.connect((err) => {
    if (err) {
        console.log('Error connecting to database');
        throw err;
    }
    console.log('Connected to database');
});

const app = express();

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '')));


app.get('/login', function(request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/', function(request, response) {
 	// Render login template
 	response.redirect('/login');
});

app.post('/auth', function(request, response) {
	// Capture the input fields
    console.log("auth page entered")
	let username = request.body.username;
	let password = request.body.passcode;
    console.log(username, password)
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		db.query('SELECT * FROM Users WHERE username = ? AND passcode = ?', [username, password], function(error, results) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
                const userId = results[0].id;

                // Store the user ID in the session
                request.session.userId = userId;
				request.session.loggedin = true;
				request.session.username = username;
				// Redirect to home page
				response.redirect('/home');
			} else {
				message = "User data not found in the database.";
                let finalMessage = `
                <html>
                    <body style="background-color: rgb(162, 205, 248);">
                        <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                    </body>
                </html>
                `;
                response.send(finalMessage);
			}			
			response.end();
		});
	} else {
		message = "Place not found in the database";
        let finalMessage = `
        <html>
            <body style="background-color: rgb(162, 205, 248);">
                <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
            </body>
        </html>
        `;
        response.send(finalMessage);
		response.end();
	}
});

app.get('/create', function(request, response) {
    if (request.session.loggedin) {
        console.log("create page entered")
        response.send(`
        <html>
          <body style="background-color: rgb(162, 205, 248);">
            <h1 style="text-align:center; color: rgb(50, 112, 192); font-family: system-ui;">Create Location</h1>
            <div style="display: flex; justify-content: center; align-items: center; height: 100px;">
            <style>
              input[type="text"]::placeholder {
                color: rgb(50, 112, 192);
              }

              input:focus {
                outline: none;
                border-color: initial;
                box-shadow: none;
              }
            </style>
            <form method="POST" action="/createplace">
              <input type="text" name="place" placeholder="Enter Place" style="background-color: transparent; border: none; border-bottom: 1px solid rgb(50, 112, 192); font-family: system-ui; color: rgb(50, 112, 192);" />
              <button type="submit" style="border: none; color: rgb(50, 112, 192); background-color: transparent; font-family: system-ui;">Create</button>
            </form>
          </div>
          </body>
        </html>
      `);
        
    } else {
        response.redirect('/login'); // Redirect to the login page if not logged in
    }
});

app.get('/delete', function(request, response) {
    if (request.session.loggedin) {
        console.log("delete page entered")
        response.send(`
        <html>
        <body style="background-color: rgb(162, 205, 248);">
          <h1 style="text-align:center; color: rgb(50, 112, 192); font-family: system-ui;">Delete Location</h1>
          <div style="display: flex; justify-content: center; align-items: center; height: 100px;">
          <style>
            input[type="text"]::placeholder {
              color: rgb(50, 112, 192);
            }

            input:focus {
              outline: none;
              border-color: initial;
              box-shadow: none;
            }
          </style>
          <form method="POST" action="/deleteplace">
            <input type="text" name="place" placeholder="Enter Place" style="background-color: transparent; border: none; border-bottom: 1px solid rgb(50, 112, 192); font-family: system-ui; color: rgb(50, 112, 192);" />
            <button type="submit" style="border: none; color: rgb(50, 112, 192); background-color: transparent; font-family: system-ui;">Delete</button>
          </form>
        </div>
        </body>
      </html>
      `);
        
    } else {
        response.redirect('/login'); // Redirect to the login page if not logged in
    }
});

app.post('/register', function(request, response) {
    const username = request.body.username;
    const password = request.body.passcode;
    console.log("register page entered")
    console.log(username, password)
    // Check if the user already exists

    // Perform validation and checks on the input data
    if (!username || !password) {
      // If username or password is missing, send an error response
      message = "Username and password are required";
      let finalMessage = `
      <html>
          <body style="background-color: rgb(162, 205, 248);">
              <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
          </body>
      </html>
      `;
      response.status(400).send(finalMessage);
    } else {
      // Insert the user into the database
      db.query('INSERT INTO Users (username, passcode) VALUES (?, ?)', [username, password], (err, results) => {
        if (err) {
          // If there's an error executing the query, send an error response
          console.log('Error executing query:', err);
          message = "User already exists";
          let finalMessage = `
          <html>
              <body style="background-color: rgb(162, 205, 248);">
                  <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
              </body>
          </html>
          `;
          response.status(500).send(finalMessage);
        } else {
          // User registration successful, redirect to the login page
          response.redirect('/login');
        }
      });
    }
});   

app.post('/createplace', function(request, response) {
    if (request.session.loggedin) {
        const userId = request.session.userId;
        const place = request.body.place;
        console.log("create place entered")
        console.log(userId, place)
        function capitalizeWords(str) {
            // Split the string into an array of words
            let words = str.split(' ');

            // Capitalize the first letter of each word
            let capitalizedWords = words.map(word => {
              let firstLetter = word.charAt(0).toUpperCase();
              let restOfWord = word.slice(1).toLowerCase();
              return firstLetter + restOfWord;
            });

            // Join the capitalized words back into a single string
            let result = capitalizedWords.join(' ');

            return result;
          }
        
        // Check if the place already exists in the database
        db.query('SELECT * FROM Locations WHERE owner_id = ? AND place = ?', [userId, place], (err, results) => {
            if (err) {
              console.log('Error executing query:', err);
              message = "Error retrieving weather data";
              let finalMessage = `
              <html>
                  <body style="background-color: rgb(162, 205, 248);">
                      <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                  </body>
              </html>
              `;
              response.status(500).send(finalMessage);
            } else {
              if (results.length > 0) {
                // Place already exists in the database
                message = "Place already exists in the database";
                let finalMessage = `
                <html>
                    <body style="background-color: rgb(162, 205, 248);">
                        <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                    </body>
                </html>
                `;
                response.status(409).send(finalMessage);
              } else {
                // Make a request to the weather API with the entered place
                fetch(`https://api.weatherapi.com/v1/current.json?key=${APIKEY}&q=${place}`)
                  .then(apiResponse => apiResponse.json())
                  .then(data => {
                    // Check if the place data is available in the API response
                    if (data.location) {
                      // Place data is available, proceed with inserting into the database
                      db.query('INSERT INTO Locations (owner_id, place) VALUES (?, ?);', [userId, place], (err, results) => {
                        if (err) {
                          console.log('Error executing query:', err);
                          message = "Error retrieving weather data";
                          let finalMessage = `
                          <html>
                              <body style="background-color: rgb(162, 205, 248);">
                                  <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                              </body>
                          </html>
                          `;
                          response.status(500).send(finalMessage);} else {
                          response.redirect('/home');
                        }
                      });
                    } else {
                      // Place data is not available in the API response
                      message = "Place not found in the API";
                      let finalMessage = `
                      <html>
                          <body style="background-color: rgb(162, 205, 248);">
                              <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                          </body>
                      </html>
                      `;
                      response.status(404).send(finalMessage);
                    }
                  })
                  .catch(error => {
                    console.log('Error:', error);
                    message = "Error accessing weather API";
                    let finalMessage = `
                    <html>
                        <body style="background-color: rgb(162, 205, 248);">
                            <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                        </body>
                    </html>
                    `;
                    response.status(500).send(finalMessage);
                  });
              }
            }
          });
        } else {
          response.redirect('/login'); // Redirect to the login page if not logged in
        }
});

app.post('/createplace', function(request, response) {
    if (request.session.loggedin) {
        const userId = request.session.userId;
        const place = request.body.place;
        console.log("create place entered")
        console.log(userId, place)
        function capitalizeWords(str) {
            // Split the string into an array of words
            let words = str.split(' ');

            // Capitalize the first letter of each word
            let capitalizedWords = words.map(word => {
              let firstLetter = word.charAt(0).toUpperCase();
              let restOfWord = word.slice(1).toLowerCase();
              return firstLetter + restOfWord;
            });

            // Join the capitalized words back into a single string
            let result = capitalizedWords.join(' ');

            return result;
          }
        
        // Check if the place already exists in the database
        db.query('SELECT * FROM Locations WHERE owner_id = ? AND place = ?', [userId, place], (err, results) => {
            if (err) {
              console.log('Error executing query:', err);
              message = "Error retrieving weather data";
              let finalMessage = `
              <html>
                  <body style="background-color: rgb(162, 205, 248);">
                      <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                  </body>
              </html>
              `;
              response.status(500).send(finalMessage);
            } else {
              if (results.length > 0) {
                // Place already exists in the database
                message = "Place already exists";
                let finalMessage = `
                <html>
                    <body style="background-color: rgb(162, 205, 248);">
                        <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                    </body>
                </html>
                `;
                response.status(409).send(finalMessage);
              } else {
                // Make a request to the weather API with the entered place
                fetch(`https://api.weatherapi.com/v1/current.json?key=${APIKEY}&q=${place}`)
                  .then(apiResponse => apiResponse.json())
                  .then(data => {
                    // Check if the place data is available in the API response
                    if (data.location) {
                      // Place data is available, proceed with inserting into the database
                      db.query('INSERT INTO Locations (owner_id, place) VALUES (?, ?);', [userId, place], (err, results) => {
                        if (err) {
                          console.log('Error executing query:', err);
                          message = "Error retrieving weather data";
                          let finalMessage = `
                          <html>
                              <body style="background-color: rgb(162, 205, 248);">
                                  <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                              </body>
                          </html>
                          `;
                          response.status(500).send(finalMessage);} else {
                          response.redirect('/home');
                        }
                      });
                    } else {
                      // Place data is not available in the API response
                      message = "Place not found in the API";
                      let finalMessage = `
                      <html>
                          <body style="background-color: rgb(162, 205, 248);">
                              <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                          </body>
                      </html>
                      `;
                      response.status(404).send(finalMessage);
                    }
                  })
                  .catch(error => {
                    console.log('Error:', error);
                    message = "Error accessing the weather API";
                    let finalMessage = `
                    <html>
                        <body style="background-color: rgb(162, 205, 248);">
                            <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                        </body>
                    </html>
                    `;
                    response.status(500).send(finalMessage);
                  });
              }
            }
          });
        } else {
          response.redirect('/login'); // Redirect to the login page if not logged in
        }
});

app.post('/deleteplace', function(request, response) {
  if (request.session.loggedin) {
    const userId = request.session.userId;
    const place = request.body.place;
    console.log("delete place entered");
    console.log(userId, place);

    // Check if the place already exists in the database
    db.query('SELECT * FROM Locations WHERE owner_id = ? AND place = ?', [userId, place], (err, results) => {
      if (err) {
        console.log('Error executing query:', err);
        message = "Error retrieving weather data";
        let finalMessage = `
        <html>
            <body style="background-color: rgb(162, 205, 248);">
                <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
            </body>
        </html>
        `;
        response.status(500).send(finalMessage);
      } else {
        if (results.length > 0) {
          // Place exists in the database, delete it
          db.query('DELETE FROM Locations WHERE owner_id = ? AND place = ?', [userId, place], (err, results) => {
            if (err) {
              console.log('Error executing query:', err);
              message = "Error retrieving weather data";
              let finalMessage = `
              <html>
                  <body style="background-color: rgb(162, 205, 248);">
                      <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
                  </body>
              </html>
              `;
              response.status(500).send(finalMessage);
              } else {
              response.redirect('/home');
            }
          });
        } else {
          // Place does not exist in the database
          message = "Place not found in the database";
          let finalMessage = `
          <html>
              <body style="background-color: rgb(162, 205, 248);">
                  <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">${message}</h1>
              </body>
          </html>
          `;
          response.status(404).send(finalMessage);
        }
      }
    });
  } else {
    response.redirect('/login'); // Redirect to the login page if not logged in
  }
});

// http://localhost:3000/home
app.get('/home', function(request, response) {
    // If the user is logged in
    if (request.session.loggedin) {
        // Output username
        const welcomeMessage = 'Welcome back, ' + request.session.username + '!';
        const userId = request.session.userId;
        console.log('User ID:', userId);
        db.query('SELECT * FROM Users INNER JOIN Locations ON Locations.owner_id = Users.id WHERE Users.id = ?', [userId], (err, results) => {
        if (err) {
            console.log('Error executing query:', err);
            response.status(500).send('Error retrieving weather data');
        } else {          
            let locations = [];
            for (let i = 0; i < results.length; i++) {
                locations.push(results[i]["place"]);
            };
            function capitalizeWords(str) {
                // Split the string into an array of words
                let words = str.split(' ');

                // Capitalize the first letter of each word
                let capitalizedWords = words.map(word => {
                  let firstLetter = word.charAt(0).toUpperCase();
                  let restOfWord = word.slice(1).toLowerCase();
                  return firstLetter + restOfWord;
                });

                // Join the capitalized words back into a single string
                let result = capitalizedWords.join(' ');

                return result;
              }

            function locationBlock(location) {
                return fetch(`https://api.weatherapi.com/v1/current.json?key=${APIKEY}&q=${capitalizeWords(location)}`)
                  .then(response => response.json())
                  .then(data => {
                    console.log(data.current.condition.text)
                    const currentCondition = data.current.condition.text;
                    const currentTemperature = data.current.temp_f;
                    const styledMessage = `
                    <div style="width: 200px; height: 80px; background-color: rgb(183, 217, 250); border: 1px solid rgb(50, 112, 192); border-radius: 5px; padding: 10px; margin: 10px; text-align:center">
                        <div style="margin:-11px;padding:0px;width:220px; height:30px; background-color: rgb(199, 226, 253); border: 1px solid rgb(50, 112, 192); border-radius: 5px;"></div>
                        <span style="margin-top:-30px;font-size: 18px; color: rgb(50, 112, 192); font-family: system-ui; display: block;">${capitalizeWords(location)}</span>
                        <span style=" padding-top:10px;font-size: 15px; color: rgb(71, 138, 205); font-family: system-ui; display: block;">${currentTemperature}°F</span>
                        <span style=" padding-top:10px;font-size: 15px; color: rgb(71, 138, 205); font-family: system-ui; display: block;">${currentCondition}</span>
                    </div>
                    `;
                    return styledMessage;
                  })
                  .catch(error => {
                    console.log('Error:', error);
                    throw error;
                  });
              }
            
            let finalMessage = `
            <html>
                <body style="background-color: rgb(162, 205, 248);">
                    <h1 style="text-align: center; color: rgb(50, 112, 192); font-family: system-ui; font-size: 40px;">Locations</h1>
                    <br>
                    <div style="padding-left:25%;display: grid; justify-items: center;align-items: center;grid-template-columns: repeat(auto-fit, minmax(80px, 0.5fr));grid-auto-rows: 100px;grid-row-gap: 50px;grid-column-gap: 120px; width:50%;">
            `;

            
            
            // Map the locations to an array of promises returned by locationBlock
            const locationPromises = locations.map(locationBlock);

            Promise.all(locationPromises)
              .then(styledMessages => {
                // All promises have resolved, generate the final message
                styledMessages.forEach(addOn => {
                  finalMessage += addOn;
                });
                finalMessage += '</div>'
                if (locations.length === 0) {
                  finalMessage += `
                    <span style="text-align: center;font-size: 18px; color: rgb(50, 112, 192); font-family: system-ui; display: block;">No locations found</span>
                  `;
                }

                finalMessage += '<br><div style="display: flex; text-align:center;align-items:center;justify-content: center;"><a href="/create" style="font-size: 20px; font-family: system-ui; text-decoration: none; font-weight: bold; cursor: pointer; color: rgb(34, 103, 194); padding-bottom: 15px; width: 220px;">Create new location</a></div><div style="display: flex; text-align:center;align-items:center;justify-content: center;"><a href="/delete" style="font-size: 20px; font-family: system-ui; text-decoration: none; font-weight: bold; cursor: pointer; color: rgb(34, 103, 194); padding-bottom: 15px; width: 220px;">Delete location</a></div><div style="display: flex; text-align:center;align-items:center;justify-content: center;"><a href="/login" style="font-size: 20px; font-family: system-ui; text-decoration: none; font-weight: bold; cursor: pointer; color: rgb(34, 103, 194); padding-bottom: 15px; width: 220px;">Sign Out</a></div></body></html>';
                response.send(finalMessage);

                console.log('Weather data:', locations);
              })
              .catch(error => {
                // Handle errors
                console.log('Error:', error);
                response.status(500).send('Error retrieving weather data');
              });
            
        }
      });
    } else {
        // Not logged in
        response.redirect('/login');
    }
});

app.listen(3000);
