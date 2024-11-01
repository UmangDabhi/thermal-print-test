const express = require("express");
const escpos = require("escpos");
const bodyParser = require("body-parser");
const cors = require("cors");

// This line may be necessary depending on your system and printer connection type
escpos.USB = require("escpos-usb");
escpos.Network = require("escpos-network"); // Ensure this is included for network connections
// escpos.Bluetooth = require("escpos-bluetooth"); // Ensure this is included for Bluetooth connections

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.urlencoded({ extended: true }));

// Serve HTML form
app.get("/", (req, res) => {
  res.send(`
        <html>
            <head>
                <title>Thermal Printer</title>
            </head>
            <body>
                <h1>Send Data to Thermal Printer</h1>
                <form method="POST" action="/print">
                    <label for="connectionType">Select Connection Type:</label>
                    <select id="connectionType" name="connectionType" required>
                        <option value="usb">USB</option>
                        <option value="wifi">Wi-Fi</option>
                        <option value="bluetooth">Bluetooth</option>
                    </select>
                    <br><br>
                    <label for="ip">Enter Printer IP Address:</label>
                    <input type="text" id="ip" name="ip" placeholder="192.168.0.99">
                    <br><br>
                    <label for="port">Enter Port Number:</label>
                    <input type="text" id="port" name="port" placeholder="9100">
                    <br><br>
                    <button type="submit">Print</button>
                </form>
            </body>
        </html>
    `);
});

// Handle print request
app.post("/print", async (req, res) => {
  const connectionType = req.body.connectionType;
  const ipAddress = req.body.ip || "192.168.0.99"; // Default IP for testing
  const portNumber = parseInt(req.body.port, 10) || 9100; // Default port for testing

  // Validation for port number
  if (connectionType !== "usb" && (isNaN(portNumber) || portNumber < 0 || portNumber > 65535)) {
    return res.status(400).send("Invalid port number. Please enter a number between 0 and 65535.");
  }

  try {
    let device;

    // Create device based on connection type
    if (connectionType === "usb") {
      // Create a new USB device instance
      device = new escpos.USB();
    } else if (connectionType === "wifi") {
      // Create a network device using the provided IP address and port number
      device = new escpos.Network(ipAddress, portNumber);
    } else if (connectionType === "bluetooth") {
      // Create a Bluetooth device using the provided IP address
      device = new escpos.Bluetooth(ipAddress);
    } else {
      return res.status(400).send("Invalid connection type.");
    }

    // Print to the selected device
    const printer = new escpos.Printer(device);

    device.open((err) => {
      if (err) {
        console.error("Printer connection error:", err);
        return res.status(500).send("Printer connection error: " + err.message);
      }

      // Print text
      printer
        .font('A')
        .size(2, 2)
        .text("Hello World")
        .cut()
        .close(() => {
          console.log("Data sent to printer successfully!");
          res.send("Data sent to printer successfully!");
        });
    });

  } catch (error) {
    console.error("Error printing data:", error);
    res.status(500).send("Error printing data: " + error.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
