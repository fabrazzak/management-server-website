const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["https://willowy-cuchufli-ba81d6.netlify.app", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cubbi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const managementDatabase = client.db("managementDB").collection("management");
    const BeVolunteerCollection = client.db("managementDB").collection("BeVolunteer");

    app.post('/add-posts', verifyToken, async (req, res) => {
      const addPost = req.body;
      if (req.user.email !== addPost.organizeEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const result = await managementDatabase.insertOne(addPost);
      res.send(result);
    });

    app.put('/add-posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const UpdatedData = req.body;
      const Data = {
        $set: {
          thumbnail: UpdatedData.thumbnail,
          title: UpdatedData.title,
          description: UpdatedData.description,
          category: UpdatedData.category,
          location: UpdatedData.location,
          volunteers_needed: UpdatedData.volunteers_needed,
          deadline: UpdatedData.deadline
        }
      };
      const result = await managementDatabase.updateOne(query, Data, option);
      res.send(result);
    });

    app.delete('/posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await managementDatabase.deleteOne(query);
      res.send(result);
    });

    app.get("/post", async (req, res) => {
      const result = await managementDatabase.find().limit(6).toArray();
      res.send(result);
    });

    app.get("/posts", async (req, res) => {
      const search = req.query.search || "";
      const query = {
        title: { $regex: search, $options: "i" }
      };
      const result = await managementDatabase.find(query).toArray();
      res.send(result);
    });

    app.get("/my_posts", async (req, res) => {
      const email = req.query.email;
      const query = { organizeEmail: email };
      const result = await managementDatabase.find(query).toArray();
      res.send(result);
    });

    app.get("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await managementDatabase.findOne(query);
      res.send(result);
    });

    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await managementDatabase.findOne(query);
      res.send(result);
    });

    app.post("/BeVolunteer", async (req, res) => {
      const requestVolunteer = req.body;
      const query = { _id: new ObjectId(requestVolunteer.post_id) };
      const findPost = await managementDatabase.findOne(query);
      if (!findPost) {
        return res.status(404).send({ message: "Post Not Found" });
      }
      const updatePost = await managementDatabase.updateOne(query, { $inc: { volunteers_needed: -1 } });
      if (updatePost.modifiedCount === 0) {
        return res.status(500).send({ message: "Failed to update the post" });
      }
      const result = await BeVolunteerCollection.insertOne(requestVolunteer);
      res.send(result);
    });

    app.get("/BeVolunteer-Post", verifyToken, async (req, res) => {
      const { email } = req.query;
      if (req.user.email !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { user_email: email };
      const result = await BeVolunteerCollection.find(query).toArray();
      res.send(result);
    });

    app.delete('/BeVolunteer-Post/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await BeVolunteerCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5h" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      }).send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      }).send({ success: true });
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {
    // Optional: Keep client open or close if needed
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send("Volunteer management Server");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});