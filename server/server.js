const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const dotenv = require('dotenv');
const documentProcessingRoutes = require('./routes/documentProcessing');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Add document processing routes
app.use('/api/document', documentProcessingRoutes);

// Legal knowledge base for fallback responses
const legalKnowledge = {
    "rti": {
        keywords: ["rti", "right to information", "information act", "public information"],
        response: "The Right to Information (RTI) Act, 2005 allows Indian citizens to request information from any public authority. You can file an RTI application to get information about government departments, public sector undertakings, etc. The application can be filed online or in person."
    },
    "court": {
        keywords: ["court", "judge", "judiciary", "case", "lawsuit", "litigation"],
        response: "Indian courts are organized in a hierarchy: Supreme Court (highest), High Courts (state level), and District Courts (local level). Each court has specific jurisdiction and handles different types of cases. The Supreme Court is the final court of appeal."
    },
    "property": {
        keywords: ["property", "land", "house", "real estate", "ownership", "title"],
        response: "Property laws in India cover various aspects including ownership, transfer, inheritance, and disputes. Key laws include the Transfer of Property Act, 1882, and the Registration Act, 1908. Property transactions must be properly documented and registered."
    },
    "marriage": {
        keywords: ["marriage", "divorce", "alimony", "maintenance", "custody"],
        response: "Indian marriage laws include the Hindu Marriage Act, Special Marriage Act, and various personal laws. Divorce can be obtained through mutual consent or on specific grounds. The court considers factors like maintenance, child custody, and property division."
    },
    "criminal": {
        keywords: ["criminal", "crime", "arrest", "bail", "police", "offense"],
        response: "Criminal law in India is governed by the Indian Penal Code (IPC) and the Code of Criminal Procedure (CrPC). The police investigate crimes, and cases are prosecuted in courts. Bail can be obtained depending on the nature of the offense."
    },
    "default": {
        response: "I can help you with various legal topics including RTI, court procedures, property laws, marriage and divorce, and criminal law. Please ask a specific question about any of these areas, and I'll provide relevant information."
    }
};

// Function to get response from LLaMA service
async function getLLaMAResponse(message) {
    try {
        const response = await axios.post('http://localhost:8000/api/llama', {
            question: message
        });
        return response.data.answer;
    } catch (error) {
        console.error('Error getting LLaMA response:', error);
        return null;
    }
}

// Function to get fallback response from knowledge base
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    let bestMatch = null;
    let maxMatches = 0;

    for (const [topic, data] of Object.entries(legalKnowledge)) {
        if (topic === "default") continue;

        const matches = data.keywords.filter(keyword => 
            lowerMessage.includes(keyword.toLowerCase())
        ).length;

        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = topic;
        }
    }

    return bestMatch 
        ? legalKnowledge[bestMatch].response 
        : legalKnowledge.default.response;
}

// Chat endpoint
app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        // Try to get response from LLaMA service
        const llamaResponse = await getLLaMAResponse(message);
        
        // If LLaMA service fails, use fallback response
        const response = llamaResponse || getFallbackResponse(message);
        
        res.json({ response });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        // Use fallback response if there's an error
        const fallbackResponse = getFallbackResponse(message);
        res.json({ response: fallbackResponse });
    }
});

// Load Aadhaar users from hardcoded + CSV
const users = [
  {
    uid: "123456789012",
    name: "Navin",
    dob: "01-01-1990",
    gender: "Male",
    phone: "9876543210",
    email: "navin@example.com",
    street: "123 Park Lane",
    vtc: "Andheri",
    subdist: "Mumbai Suburban",
    district: "Mumbai",
    state: "Maharashtra",
    pincode: "400053"
  },
  {
    uid: "234567890123",
    name: "Priya Sharma",
    dob: "15-07-1995",
    gender: "Female",
    phone: "9123456789",
    email: "priya@example.com",
    street: "45 MG Road",
    vtc: "Koramangala",
    subdist: "Bangalore South",
    district: "Bangalore",
    state: "Karnataka",
    pincode: "560034"
  }
];

fs.createReadStream(path.join(__dirname, "users.csv"))
  .pipe(csv())
  .on("data", (row) => users.push(row))
  .on("end", () => {
    console.log("✅ Aadhaar user data loaded from CSV.");
  });

// --- DigiLocker Simulator Setup ---
const digilockerPath = path.join(__dirname, "digilocker-data.json");

// Read DigiLocker data (local JSON file)
function readDigiLockerData() {
  if (!fs.existsSync(digilockerPath)) return {};
  return JSON.parse(fs.readFileSync(digilockerPath, "utf-8"));
}

// Write DigiLocker data
function writeDigiLockerData(data) {
  fs.writeFileSync(digilockerPath, JSON.stringify(data, null, 2));
}

// --- Routes ---

// GET: List all available UIDs
app.get("/api/aadhaar-list", (req, res) => {
  res.json(users.map(u => ({ uid: u.uid })));
});

// POST: Verify UID exists
app.post("/api/verify-aadhaar", (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "UID required" });

  const user = users.find(u => u.uid === uid);
  if (!user) return res.status(404).json({ error: "UID not found" });

  res.json({ success: true, user });
});

// POST: Send OTP (simulated)
app.post("/api/send-otp", (req, res) => {
  const { uid } = req.body;
  const user = users.find(u => u.uid === uid);
  if (!user) return res.status(404).json({ error: "UID not found" });

  const maskedPhone = "XXXXXXXX" + user.phone.slice(-2);
  res.json({ message: `OTP sent to ${maskedPhone}` });
});

// POST: Verify OTP & log login in Firebase
app.post("/api/verify-otp", async (req, res) => {
  const { uid, otp } = req.body;
  if (!uid || !otp) return res.status(400).json({ error: "UID and OTP required" });

  if (otp !== "123456") return res.status(401).json({ error: "Invalid OTP" });

  const user = users.find(u => u.uid === uid);
  if (!user) return res.status(404).json({ error: "UID not found" });

  try {
    // Log login to Firebase Realtime Database
    const loginRef = db.ref(`logins/${uid}`).push();
    await loginRef.set({
      timestamp: new Date().toISOString(),
      status: "success"
    });

    res.json({ verified: true, message: "OTP verified and login logged." });
  } catch (error) {
    res.status(500).json({ error: "Login logging failed" });
  }
});

// --- DigiLocker simulator API ---

// POST: Generate and store a document for user
app.post("/api/generate-document", (req, res) => {
  const { uid, content, metadata } = req.body;
  if (!uid || !content) return res.status(400).json({ error: "UID and content required" });

  const data = readDigiLockerData();
  if (!data[uid]) data[uid] = { documents: [] };

  const docId = Date.now().toString();
  
  // Save document with metadata including 'type' for filtering on frontend
  data[uid].documents.push({
    docId,
    content,
    metadata: metadata || {},
    generatedAt: new Date().toISOString(),
    signed: false
  });

  writeDigiLockerData(data);
  res.json({ success: true, message: "Document generated", docId });
});

// GET: List all documents for a user
app.get("/api/documents/:uid", (req, res) => {
  const uid = req.params.uid;
  const data = readDigiLockerData();

  if (!data[uid]) return res.status(404).json({ error: "User not found or no documents" });

  res.json({ documents: data[uid].documents });
});

// GET: Get a specific document
app.get("/api/document/:uid/:docId", (req, res) => {
  const { uid, docId } = req.params;
  const data = readDigiLockerData();

  if (!data[uid]) return res.status(404).json({ error: "User not found" });

  const doc = data[uid].documents.find(d => d.docId === docId);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  res.json(doc);
});

// POST: eSign a document
app.post("/api/esign-document", (req, res) => {
  const { uid, docId } = req.body;
  if (!uid || !docId) return res.status(400).json({ error: "UID and docId required" });

  const data = readDigiLockerData();

  if (!data[uid]) return res.status(404).json({ error: "User not found" });

  const doc = data[uid].documents.find(d => d.docId === docId);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  if (doc.signed) return res.status(400).json({ error: "Document already signed" });

  doc.signed = true;
  doc.signedAt = new Date().toISOString();
  doc.signature = "Simulated DigiLocker eSign";

  writeDigiLockerData(data);

  res.json({ success: true, message: "Document signed (simulated eSign)" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});